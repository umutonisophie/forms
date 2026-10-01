"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const studentSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "Max 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Max 50 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export default function AddStudentForm() {
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
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, courseIds: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      if (err.status === 409) {
        setError("email", { type: "server", message: "Email already taken." });
      } else if (err.error?.fields) {
        Object.entries(err.error.fields).forEach(([field, msgs]) => {
          setError(field, { type: "server", message: msgs[0] });
        });
      }
    },
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm space-y-6">
      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-[#1b1c3a] font-serif">
            Student Admission
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Create a new student academic record
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              First Name
            </label>
            <input
              {...register("firstName")}
              placeholder="e.g. Triumph"
              className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
                errors.firstName
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
              }`}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Last Name
            </label>
            <input
              {...register("lastName")}
              placeholder="e.g. Olajimi"
              className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
                errors.lastName
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
              }`}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="e.g. triumpholajimi@gmail.com"
            className={`w-full px-4 py-3 text-sm rounded-xl bg-gray-50 border text-[#1b1c3a] placeholder:text-gray-400 focus:bg-white focus:outline-none transition font-medium ${
              errors.email
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#b89120] focus:ring-2 focus:ring-[#b89120]/20"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
            {mutation.error?.error?.message || "Failed to create student."}
          </div>
        )}

        {/* Gold University Button */}
        <button
          type="submit"
          disabled={!isValid || mutation.isPending || isSubmitting}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#b89120] hover:bg-[#a07c17] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white shadow-md shadow-[#b89120]/20 transition transform active:scale-[0.99]"
        >
          {mutation.isPending
            ? "Submitting Admission..."
            : "Submit Student Admission"}
        </button>
      </form>
    </div>
  );
}