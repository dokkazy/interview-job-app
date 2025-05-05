"use client"

import { useState } from "react"
import type { Application, User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Download, MessageSquare, Calendar, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { toDate } from "@/lib/utils"
import { ChatDialog } from "@/components/sections/chat/chat-dialog"
import { sendNotification } from "@/lib/stream"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/components/sections/chat/chat-provider"
import { toast } from "sonner"

interface ApplicantCardProps {
  application: Application & { applicant: User; job?: { title: string } }
  onUpdateStatus: (applicationId: string, status: string) => void
  onContact?: (applicantId: string) => void
}

// Helper to ensure Stream user exists
async function ensureStreamUser(user: { id: string, displayName: string, photoURL?: string }) {
  try {
    await fetch('/api/create-stream-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.displayName,
        image: user.photoURL,
      }),
    });
  } catch (error) {
    console.error('Failed to ensure Stream user:', error);
  }
}

export function ApplicantCard({ application, onUpdateStatus, onContact }: ApplicantCardProps) {
  const { applicant } = application
  const { user } = useAuth()
  const { client } = useChat()
  const [viewedState, setViewedState] = useState(application.status !== "pending")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "reviewing":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "hired":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleView = () => {
    setViewedState(true)
    if (application.status === "pending") {
      onUpdateStatus(application.id, "reviewing")
    }
    setDetailsOpen(true)
  }

  const handleContact = async () => {
    if (!user || !client) {
      toast.error("Chat is not ready. Please wait and try again.");
      return;
    }

    try {
      setChatOpen(true);

      // Ensure both users exist in Stream
      await ensureStreamUser({
        id: user.id,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      await ensureStreamUser({
        id: applicant.id,
        displayName: applicant.displayName,
        photoURL: applicant.photoURL,
      });

      // Send notification to job seeker if this is the first contact
      if (onContact) {
        onContact(applicant.id);

        await sendNotification(
          user.id,
          applicant.id,
          `${user.displayName} from ${application.job?.title || "a job posting"} has sent you a message.`,
          application.job?.title,
          client
        );

        toast.success(`${applicant.displayName} will be notified of your message.`);
      }
    } catch (error) {
      console.error("Error initiating chat:", error);
      toast.error(`Could not start chat. ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <>
      <Card className={!viewedState ? "border-blue-500 shadow-sm" : ""}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={applicant.photoURL || "/placeholder.svg"} />
                <AvatarFallback>{getInitials(applicant.displayName)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h3 className="font-semibold">{applicant.displayName}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(application.status)}`} />
                    <span className="text-sm text-muted-foreground">
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    {!viewedState && <Badge variant="outline">New</Badge>}
                  </div>
                </div>

                {applicant.profile?.headline && (
                  <p className="text-muted-foreground mb-2">{applicant.profile.headline}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {applicant.profile?.skills?.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {applicant.profile?.skills && applicant.profile.skills.length > 5 && (
                    <Badge variant="secondary">+{applicant.profile.skills.length - 5} more</Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Applied {formatDistanceToNow(toDate(application.appliedAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Resume
                </a>
              </Button>

              <Button variant="outline" size="sm" onClick={handleContact}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "reviewing")}>
                    Reviewing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "shortlisted")}>
                    Shortlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "rejected")}>Reject</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "hired")}>Hire</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" asChild disabled={application.status === "rejected"} aria-disabled={application.status === "rejected"} title={application.status === "rejected" ? "Cannot schedule interview for rejected applications" : undefined}>
                <Link href={`/interviews/schedule?applicationId=${application.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Link>
              </Button>
            </div>
          </div>

          {application.coverLetter && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Cover Letter</h4>
              <p className="text-muted-foreground">{application.coverLetter}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
            <DialogDescription>
              Applied {formatDistanceToNow(toDate(application.appliedAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={applicant.photoURL || "/placeholder.svg"} />
                <AvatarFallback>{getInitials(applicant.displayName)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-xl font-semibold">{applicant.displayName}</h2>
                {applicant.profile?.headline && <p className="text-muted-foreground">{applicant.profile.headline}</p>}
                <p className="text-sm text-muted-foreground">{applicant.email}</p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {applicant.profile?.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="application">Application</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                {applicant.profile?.bio && (
                  <div className="space-y-2">
                    <h3 className="font-medium">About</h3>
                    <p>{applicant.profile.bio}</p>
                  </div>
                )}

                {applicant.profile?.experience && applicant.profile.experience.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Experience</h3>
                    <div className="space-y-4">
                      {applicant.profile.experience.map((exp) => (
                        <div key={exp.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <h4 className="font-medium">{exp.title}</h4>
                          <p className="text-muted-foreground">{exp.company}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(toDate(exp.startDate), { addSuffix: true })} -
                            {exp.current
                              ? " Present"
                              : exp.endDate
                                ? ` ${formatDistanceToNow(toDate(exp.endDate), { addSuffix: true })}`
                                : ""}
                          </p>
                          {exp.description && <p className="mt-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {applicant.profile?.education && applicant.profile.education.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Education</h3>
                    <div className="space-y-4">
                      {applicant.profile.education.map((edu) => (
                        <div key={edu.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <h4 className="font-medium">
                            {edu.degree} in {edu.field}
                          </h4>
                          <p className="text-muted-foreground">{edu.institution}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(toDate(edu.startDate), { addSuffix: true })} -
                            {edu.current
                              ? " Present"
                              : edu.endDate
                                ? ` ${formatDistanceToNow(toDate(edu.endDate), { addSuffix: true })}`
                                : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="application" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Status</h3>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(application.status)}`} />
                    <Badge>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2">
                        Update Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "pending")}>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "reviewing")}>
                        Reviewing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "shortlisted")}>
                        Shortlist
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "rejected")}>
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(application.id, "hired")}>Hire</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Resume</h3>
                  <Button asChild variant="outline">
                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Resume
                    </a>
                  </Button>
                </div>

                {application.coverLetter && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Cover Letter</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <p>{application.coverLetter}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={handleContact}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Applicant
                  </Button>

                  <Button variant="outline" asChild disabled={application.status === "rejected"} aria-disabled={application.status === "rejected"} title={application.status === "rejected" ? "Cannot schedule interview for rejected applications" : undefined}>
                    <Link href={`/interviews/schedule?applicationId=${application.id}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </Link>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      {chatOpen && (
        <ChatDialog
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUser={applicant}
          jobId={application.jobId}
          jobTitle={application.job?.title}
        />
      )}
    </>
  )
}
