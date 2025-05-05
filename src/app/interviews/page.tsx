"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, deleteDoc, doc as firestoreDoc } from "firebase/firestore";
import type { Interview } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function InterviewsListPage() {
  const { user, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteInterview = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this interview? This action cannot be undone.")) return;
    try {
      await deleteDoc(firestoreDoc(db, "interviews", id));
      setInterviews((prev) => prev.filter((interview) => interview.id !== id));
    } catch {
      alert("Failed to delete interview.");
    }
  };

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true);
      try {
        // DEBUG: Fetch all interviews regardless of user
        const q = query(collection(db, "interviews"), orderBy("scheduledAt", "desc"));
        const snap = await getDocs(q);
        const all = snap.docs;
        console.log("Loaded ALL interview docs:", all.map(doc => ({ id: doc.id, ...doc.data() })));
        // Remove duplicates (not needed here, but keep for consistency)
        const unique = Array.from(
          new Map(
            all.map((doc) => {
              const data = doc.data() as Interview;
              let scheduledAt = data.scheduledAt;
              if (
                scheduledAt &&
                typeof scheduledAt === 'object' &&
                'toDate' in scheduledAt &&
                typeof scheduledAt.toDate === 'function'
              ) {
                scheduledAt = scheduledAt.toDate();
              }
              return [
                doc.id,
                { ...data, id: doc.id, scheduledAt },
              ];
            })
          ).values()
        );
        setInterviews(unique);
      } catch {
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Interviews</h1>
      {interviews.length === 0 ? (
        <p className="text-muted-foreground">No interviews found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviews.map((interview) => {
            const isUpcoming =
              new Date(interview.scheduledAt).getTime() > Date.now();
            return (
              <Card key={interview.id}>
                <CardHeader>
                  <CardTitle>Interview for Job: {interview.jobId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <span className="font-semibold">Scheduled:</span>{" "}
                    {format(new Date(interview.scheduledAt), "PPpp")}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Duration:</span>{" "}
                    {interview.duration} min
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Status:</span>{" "}
                    {interview.status}
                  </div>
                  {interview.interviewType && (
                    <div className="mb-2">
                      <span className="font-semibold">Interview Type:</span>{" "}
                      {interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)}
                    </div>
                  )}
                  {interview.notes && (
                    <div className="mb-2">
                      <span className="font-semibold">Notes:</span>{" "}
                      {interview.notes}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {isUpcoming && (
                      <Button asChild>
                        <Link href={`/interviews/${interview.id}`}>Join</Link>
                      </Button>
                    )}
                    {user.role === "recruiter" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDeleteInterview(interview.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}