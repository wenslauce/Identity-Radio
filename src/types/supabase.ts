export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string
					updated_at: string | null
					username: string | null
					avatar_url: string | null
				}
				Insert: {
					id: string
					updated_at?: string | null
					username?: string | null
					avatar_url?: string | null
				}
				Update: {
					id?: string
					updated_at?: string | null
					username?: string | null
					avatar_url?: string | null
				}
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}