"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const INTENTS = [
  { value: "Relationship", label: "Relationship" },
  { value: "Fun", label: "Looking for fun" },
  { value: "Chat", label: "Just chatting" },
];

export default function OnboardingForm({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    semester: "",
    study_field: "",
    intent: "Relationship",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      nickname: formData.nickname, // New Field
      semester: parseInt(formData.semester),
      study_field: formData.study_field,
      intent: formData.intent,
      bio: formData.bio,
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`, // Default avatar
    });

    if (error) {
      console.error(error);
      alert("Error saving profile"); // Use toast in real app
      setLoading(false);
    } else {
      router.refresh(); // Refresh server state
      router.push("/browse");
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            Create Your Profile
          </CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (Public)</Label>
              <Input
                id="nickname"
                placeholder="How should we call you?"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                onValueChange={(val) =>
                  setFormData({ ...formData, semester: val })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="study_field">Field of Study</Label>
              <Input
                id="study_field"
                placeholder="e.g. Computer Science, Psychology"
                value={formData.study_field}
                onChange={(e) =>
                  setFormData({ ...formData, study_field: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>What are you here for?</Label>
              <RadioGroup
                defaultValue="Relationship"
                onValueChange={(val) =>
                  setFormData({ ...formData, intent: val })
                }
                className="grid gap-2"
              >
                {INTENTS.map((intent) => (
                  <div
                    key={intent.value}
                    className="flex items-center space-x-2 border p-3 rounded-md has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={intent.value} id={intent.value} />
                    <Label
                      htmlFor={intent.value}
                      className="cursor-pointer flex-1"
                    >
                      {intent.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell others what you like..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
