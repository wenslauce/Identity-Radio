import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const AdminBoard = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']); // Default 3 options
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time subscription for poll updates
    const channel = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_questions'
        },
        (payload) => {
          console.log('Poll updated:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createPoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, deactivate any currently active polls
      await supabase
        .from('poll_questions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create the new poll
      const formattedOptions = options.map((text, index) => ({
        id: index + 1,
        text,
        votes: 0
      }));

      const { error } = await supabase
        .from('poll_questions')
        .insert({
          question,
          options: formattedOptions,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poll created successfully"
      });

      // Reset form
      setQuestion('');
      setOptions(['', '', '']);
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Create New Poll</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Question</label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Options</label>
          {options.map((option, index) => (
            <Input
              key={index}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full"
            />
          ))}
        </div>

        <Button 
          onClick={createPoll}
          className="w-full"
        >
          Create Poll
        </Button>
      </div>
    </div>
  );
};