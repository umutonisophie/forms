"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const courseSchema = z.object({
  code: z
    .string()
    .regex(
      /^[A-Z]{2,6}[0-9]{2,4}$/i,
      "Format: 2-6 letters then 2-4 digits (e.g. WEB101)",
    ),
  title: z.string().min(3, "Title must be 3-100 characters").max(100),
  instructor: z
    .string()
    .min(2, "Instructor name must be 2-60 characters")
    .max(60),
  credits: z.coerce
    .number()
    .min(1, "Credits: 1 to 6")
    .max(6, "Credits: 1 to 6"),
});

export default function AddCourseForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isValid,
      isDirty,
      touchedFields,
      isSubmitting,
      isValidating,
    },
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(courseSchema),
    defaultValues: { code: "", title: "", instructor: "", credits: 3 },
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      if (err.status === 409) {
        setError("code", {
          type: "server",
          message: "Course code already exists.",
        });
      } else if (err.error?.fields) {
        Object.entries(err.error.fields).forEach(([field, msgs]) => {
          setError(field, { type: "server", message: msgs[0] });
        });
      }
    },
  });

  return (
    <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm space-y-6">
      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-[#1b1c3a] font-serif">
            New Course
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Add offering to the university catalog
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
            isValid
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {isValid ? "● Ready" : "○ Incomplete"}
        </span>
      </div>

      {/* Live Form State Inspector */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-2">
        <div className="text-[11px] font-bold tracking-wider uppercase text-gray-400">
          React Hook Form • Live State
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-gray-400 text-[10px] uppercase font-bold">
              isDirty
            </div>
            <div
              className={`font-bold mt-0.5 text-xs ${isDirty ? "text-[#1b1c3a]" : "text-gray-400"}`}
            >
              {String(isDirty)}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-gray-400 text-[10px] uppercase font-bold">
              isValidating
            </div>
            <div
              className={`font-bold mt-0.5 text-xs ${isValidating ? "text-[#b89120]" : "text-gray-400"}`}
            >
              {String(isValidating)}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-gray-400 text-[10px] uppercase font-bold">
              isSubmitting
            </div>
            <div
              className={`font-bold mt-0.5 text-xs ${mutation.isPending || isSubmitting ? "text-indigo-600" : "text-gray-400"}`}
            >
              {String(mutation.isPending || isSubmitting)}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-gray-400 text-[10px] uppercase font-bold">
              Touched
            </div>
            <div className="font-bold text-gray-700 mt-0.5 text-xs truncate">
              {Object.keys(touchedFields).length > 0
                ? Object.keys(touchedFields).join(", ")
                : "none"}
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Course Code
            </label>
            <input
              {...register("code")}
              placeholder="e.g. DU0389"
              className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
                errors.code
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
              }`}
            />
            {errors.code && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Credits (1–6)
            </label>
            <input
              type="number"
              {...register("credits")}
              className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] focus:bg-white focus:outline-none transition font-medium ${
                errors.credits
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
              }`}
            />
            {errors.credits && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.credits.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Programme / Course Title
          </label>
          <input
            {...register("title")}
            placeholder="e.g. Cyber-Security Foundations"
            className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
              errors.title
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Instructor Name
          </label>
          <input
            {...register("instructor")}
            placeholder="e.g. Prof. Alan Turing"
            className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
              errors.instructor
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
            }`}
          />
          {errors.instructor && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.instructor.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
            {mutation.error?.error?.message || "Failed to create course."}
          </div>
        )}

        {/* Gold University Button */}
        <button
          type="submit"
          disabled={!isValid || mutation.isPending || isSubmitting}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#b89120] hover:bg-[#a07c17] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white shadow-md shadow-[#b89120]/20 transition transform active:scale-[0.99]"
        >
          {mutation.isPending ? "Saving Course..." : "Save Course to Catalog"}
        </button>
      </form>
    </div>
  );
}