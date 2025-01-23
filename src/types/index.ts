// Chat types
export interface ChatUser {
	id: string;
	username: string;
	status: 'online' | 'offline';
	last_seen: string;
	country?: string;
}

// Song request types
export interface SongRequest {
	id: string;
	title: string;
	artist: string;
	requested_at: string;
	status: 'pending' | 'played';
}

// Auth types
export interface AdminUser {
	id: string;
	user_id: string;
	created_at: string;
}