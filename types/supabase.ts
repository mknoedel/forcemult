export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      n8n_chat_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      n8n_chat_histories: {
        Row: {
          id: number;
          session_id: string;
          message: Json;
        };
        Insert: {
          id?: number;
          session_id: string;
          message: Json;
        };
        Update: {
          id?: number;
          session_id?: string;
          message?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type ChatSession =
  Database['public']['Tables']['n8n_chat_sessions']['Row'];
export type N8nChatHistory =
  Database['public']['Tables']['n8n_chat_histories']['Row'];

/** A single LangChain message as stored in n8n_chat_histories.message. */
export interface N8nStoredMessage {
  type: string; // 'human' | 'ai' | 'system' | 'tool'
  content: string;
}
