"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface SkillsInputProps {
  value: string[]
  onChange: (skills: string[]) => void
}

export function SkillsInput({ value: initialSkills, onChange }: SkillsInputProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [inputValue, setInputValue] = useState("")

  const addSkill = useCallback(() => {
    if (inputValue.trim() !== "" && !skills.includes(inputValue.trim())) {
      const newSkills = [...skills, inputValue.trim()]
      setSkills(newSkills)
      onChange(newSkills)
      setInputValue("")
    }
  }, [inputValue, skills, onChange])

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter((skill) => skill !== skillToRemove)
    setSkills(newSkills)
    onChange(newSkills)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <Input
          type="text"
          placeholder="Add a skill"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <Button type="button" onClick={addSkill}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
            <Button variant="ghost" size="icon" onClick={() => removeSkill(skill)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {skill}</span>
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
