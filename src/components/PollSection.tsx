import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export const PollSection = () => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivePoll();

    // Set up real-time subscription
    const channel = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_questions'
        },
        () => {
          fetchActivePoll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivePoll = async () => {
    try {
      const { data, error } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // First cast to unknown, then to PollOption[] to satisfy TypeScript
        const pollOptions = (data.options as unknown) as PollOption[];
        
        setActivePoll({
          id: data.id,
          question: data.question,
          options: pollOptions,
        });
        setHasVoted(false); // Reset vote status when poll changes
      } else {
        setActivePoll(null);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      setActivePoll(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (optionId: number) => {
    if (!hasVoted && activePoll) {
      const updatedOptions = activePoll.options.map(option =>
        option.id === optionId
          ? { ...option, votes: option.votes + 1 }
          : option
      );

      try {
        const { error } = await supabase
          .from('poll_questions')
          .update({ 
            options: updatedOptions as unknown as Json
          })
          .eq('id', activePoll.id);

        if (error) throw error;

        setActivePoll({ ...activePoll, options: updatedOptions });
        setHasVoted(true);
      } catch (error) {
        console.error('Error updating votes:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="glass rounded-xl p-4">Loading poll...</div>;
  }

  if (!activePoll) {
    return <div className="glass rounded-xl p-4">No active poll at the moment.</div>;
  }

  const totalVotes = activePoll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-4">{activePoll.question}</h2>
      
      <div className="space-y-4">
        {activePoll.options.map(option => (
          <div key={option.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span>{option.text}</span>
              <span className="text-sm text-muted-foreground">
                {totalVotes > 0
                  ? `${Math.round((option.votes / totalVotes) * 100)}%`
                  : '0%'}
              </span>
            </div>
            
            <Progress
              value={totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}
              className="h-2"
            />
            
            <Button
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              variant="secondary"
              className="w-full mt-1"
            >
              Vote
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Total votes: {totalVotes}
      </p>
    </div>
  );
};