import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UsernameFormProps {
  onSubmit: (username: string) => Promise<void>;
}

export const UsernameForm = ({ onSubmit }: UsernameFormProps) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(username.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-4">Join the Chat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Choose a username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !username.trim()} className="w-full">
          {isSubmitting ? 'Joining...' : 'Join Chat'}
        </Button>
      </form>
    </div>
  );
};