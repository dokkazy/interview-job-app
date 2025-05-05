export interface User {
    id: string
    email: string
    displayName: string
    photoURL: string
    role: "job-seeker" | "recruiter"
    profile?: UserProfile
    interests?: string[]
    createdAt: Date
  }
  
  export interface UserProfile {
    headline?: string
    bio?: string
    location?: string
    skills?: string[]
    experience?: Experience[]
    education?: Education[]
    resumeUrl?: string
    publicProfileUrl?: string
  }
  
  export interface Experience {
    id: string
    title: string
    company: string
    location?: string
    startDate: Date
    endDate?: Date
    current: boolean
    description?: string
  }
  
  export interface Education {
    id: string
    institution: string
    degree: string
    field: string
    startDate: Date
    endDate?: Date
    current: boolean
  }
  
  export interface Job {
    id: string
    recruiterId: string
    companyName: string
    companyLogo?: string
    title: string
    description: string
    location: string
    locationType: "remote" | "hybrid" | "on-site"
    employmentType: "full-time" | "part-time" | "contract" | "internship"
    skills: string[]
    salary?: {
      min: number
      max: number
      currency: string
    }
    postedAt: Date
    expiresAt?: Date
    status: "active" | "closed" | "draft"
  }
  
  import type { FieldValue } from "firebase/firestore";
  
  export interface Application {
    id: string
    jobId: string
    recruiterId: string
    applicantId: string
    resumeUrl: string
    coverLetter?: string
    status: "pending" | "reviewing" | "shortlisted" | "rejected" | "hired"
    appliedAt: Date | FieldValue
    updatedAt: Date | FieldValue
  }
  
  export interface Interview {
    id: string
    applicationId: string
    jobId: string
    recruiterId: string
    applicantId: string
    scheduledAt: Date
    duration: number // in minutes
    status: "scheduled" | "completed" | "cancelled"
    meetingUrl?: string
    notes?: string
    interviewType?: "video" | "phone" | "in-person"
  }
  
  export interface Chat {
    id: string
    participants: string[]
    lastMessage?: {
      text: string
      sentAt: Date
      senderId: string
    }
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Message {
    id: string
    chatId: string
    senderId: string
    text: string
    attachments?: {
      url: string
      type: string
      name: string
    }[]
    sentAt: Date
    readBy: string[]
  }
  