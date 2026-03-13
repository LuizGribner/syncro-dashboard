export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          role: string
          email: string | null
          salary: number
          currency: string
          start_date: string | null
          status: 'active' | 'inactive'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      clients: {
        Row: {
          id: string
          name: string
          company: string | null
          email: string | null
          country: string | null
          platform: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string | null
          status: 'active' | 'paused' | 'completed' | 'cancelled'
          value: number
          currency: string
          start_date: string | null
          end_date: string | null
          platform: string | null
          upwork_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_employees: {
        Row: {
          id: string
          project_id: string
          employee_id: string
          role_in_project: string | null
          allocation: number
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_employees']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['project_employees']['Insert']>
      }
      payments: {
        Row: {
          id: string
          employee_id: string
          project_id: string | null
          amount: number
          currency: string
          payment_date: string
          method: string | null
          description: string | null
          status: 'paid' | 'pending' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          name: string
          storage_path: string
          size_bytes: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_files']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['project_files']['Insert']>
      }
    }
  }
}

// Handy derived types
export type Employee = Database['public']['Tables']['employees']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectEmployee = Database['public']['Tables']['project_employees']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type ProjectFile = Database['public']['Tables']['project_files']['Row']

export type ProjectWithClient = Project & { clients: Client | null }
export type ProjectWithTeam = ProjectWithClient & {
  project_employees: (ProjectEmployee & { employees: Employee })[]
}
