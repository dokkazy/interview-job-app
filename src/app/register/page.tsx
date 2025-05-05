"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { toast } from "sonner";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthCookies } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: searchParams.get("role") || "job-seeker",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update profile
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      const userData = {
        displayName: formData.name,
        email: formData.email,
        role: formData.role,
        photoURL: "",
        createdAt: serverTimestamp(),
        profile: {},
        interests: [],
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // Set auth cookies
      setAuthCookies({
        id: userCredential.user.uid,
        ...userData,
        role: userData.role as "job-seeker" | "recruiter",
        createdAt: new Date(),
      });

      toast.success("Account created successfully!");

      // Redirect based on role
      router.push("/dashboard");
    } catch (error: unknown) {
      let message = "An error occurred.";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message: string }).message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Join JobConnect to find your dream job or perfect candidate.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>I am a</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={handleRoleChange}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="job-seeker" id="job-seeker" />
                  <Label htmlFor="job-seeker">Job Seeker</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recruiter" id="recruiter" />
                  <Label htmlFor="recruiter">Recruiter</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
