import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Flag } from 'lucide-react';
import type { ChatUser } from '@/hooks/useChatSession';

interface Message {
	id: string;
	message: string;
	created_at: string;
	user_id: string;
	user: {
		id: string;
		username: string;
		status: 'online' | 'offline';
	};
}

interface ChatSectionProps {
	currentUser: ChatUser;
	messages?: Message[];
	onSendMessage: (message: string) => void;
}

export const ChatSection = ({ currentUser, onSendMessage, messages = [] }: ChatSectionProps) => {
	const [message, setMessage] = useState('');
	const { toast } = useToast();

	const handleSendMessage = () => {
		if (!message.trim()) return;
		onSendMessage(message);
		setMessage('');
	};

	return (
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1 mb-4">
				<div className="space-y-2">
					{messages.map((msg) => (
						<div key={msg.id} className="flex items-start gap-2">
							<div className="flex-1">
								<div className="text-sm font-medium flex items-center gap-2">
									{msg.user.username}
									<span className={`w-2 h-2 rounded-full ${
										msg.user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
									}`} />
								</div>
								<div className="text-sm">{msg.message}</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									toast({
										title: 'Message reported',
										description: 'Thank you for reporting this message',
									});
								}}
							>
								<Flag className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			</ScrollArea>
			<div className="flex gap-2">
				<Input
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
					placeholder="Type a message..."
				/>
				<Button onClick={handleSendMessage}>Send</Button>
			</div>
		</div>
	);
};