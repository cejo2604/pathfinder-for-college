export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      academic_documents: {
        Row: {
          confirmed_at: string | null
          created_at: string
          extracted_profile: Json
          extraction_error: string | null
          file_name: string
          file_type: string
          id: string
          processing_status: string
          storage_path: string
          student_id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          extracted_profile?: Json
          extraction_error?: string | null
          file_name: string
          file_type: string
          id?: string
          processing_status?: string
          storage_path: string
          student_id: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          extracted_profile?: Json
          extraction_error?: string | null
          file_name?: string
          file_type?: string
          id?: string
          processing_status?: string
          storage_path?: string
          student_id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      careers: {
        Row: {
          adjacent_careers: string[]
          coursework: string[]
          created_at: string
          description: string
          entry_roles: string[]
          id: string
          industry: string
          internship_ideas: string[]
          portfolio_ideas: string[]
          relevant_majors: string[]
          relevant_minors: string[]
          skill_weights: Json
          title: string
          updated_at: string
        }
        Insert: {
          adjacent_careers?: string[]
          coursework?: string[]
          created_at?: string
          description: string
          entry_roles?: string[]
          id: string
          industry: string
          internship_ideas?: string[]
          portfolio_ideas?: string[]
          relevant_majors?: string[]
          relevant_minors?: string[]
          skill_weights?: Json
          title: string
          updated_at?: string
        }
        Update: {
          adjacent_careers?: string[]
          coursework?: string[]
          created_at?: string
          description?: string
          entry_roles?: string[]
          id?: string
          industry?: string
          internship_ideas?: string[]
          portfolio_ideas?: string[]
          relevant_majors?: string[]
          relevant_minors?: string[]
          skill_weights?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number
          prerequisites: string[]
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits: number
          prerequisites?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          prerequisites?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_actions: {
        Row: {
          action_key: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_key: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          career_id: string | null
          career_interests: string[]
          courses: Json
          created_at: string
          credits_completed: number
          degree: string
          goal: string
          goal_category: string
          gpa: number
          graduation_target: string
          id: string
          interests: string[]
          major: string
          minor: string | null
          name: string
          priorities: string[]
          school: string
          skills: string[]
          updated_at: string
          year: string
        }
        Insert: {
          career_id?: string | null
          career_interests?: string[]
          courses?: Json
          created_at?: string
          credits_completed?: number
          degree?: string
          goal?: string
          goal_category?: string
          gpa?: number
          graduation_target?: string
          id: string
          interests?: string[]
          major?: string
          minor?: string | null
          name?: string
          priorities?: string[]
          school?: string
          skills?: string[]
          updated_at?: string
          year?: string
        }
        Update: {
          career_id?: string | null
          career_interests?: string[]
          courses?: Json
          created_at?: string
          credits_completed?: number
          degree?: string
          goal?: string
          goal_category?: string
          gpa?: number
          graduation_target?: string
          id?: string
          interests?: string[]
          major?: string
          minor?: string | null
          name?: string
          priorities?: string[]
          school?: string
          skills?: string[]
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          required_credits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          kind: string
          name: string
          required_credits: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          required_credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      saved_paths: {
        Row: {
          created_at: string
          id: string
          is_chosen: boolean
          path_id: string
          path_name: string
          program: string
          question: string
          scenario_id: string
          snapshot: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_chosen?: boolean
          path_id: string
          path_name: string
          program?: string
          question?: string
          scenario_id: string
          snapshot?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_chosen?: boolean
          path_id?: string
          path_name?: string
          program?: string
          question?: string
          scenario_id?: string
          snapshot?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_courses: {
        Row: {
          confidence: string
          course_id: string | null
          created_at: string
          credits: number
          extracted_code: string
          extracted_title: string
          grade: string | null
          id: string
          source_document_id: string | null
          status: string
          student_id: string
          term: string
          updated_at: string
          verified_at: string | null
          verified_by_student: boolean
          waitlist_position: number | null
        }
        Insert: {
          confidence?: string
          course_id?: string | null
          created_at?: string
          credits?: number
          extracted_code?: string
          extracted_title?: string
          grade?: string | null
          id?: string
          source_document_id?: string | null
          status?: string
          student_id: string
          term?: string
          updated_at?: string
          verified_at?: string | null
          verified_by_student?: boolean
          waitlist_position?: number | null
        }
        Update: {
          confidence?: string
          course_id?: string | null
          created_at?: string
          credits?: number
          extracted_code?: string
          extracted_title?: string
          grade?: string | null
          id?: string
          source_document_id?: string | null
          status?: string
          student_id?: string
          term?: string
          updated_at?: string
          verified_at?: string | null
          verified_by_student?: boolean
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "student_courses_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "academic_documents"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
