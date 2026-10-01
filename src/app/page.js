"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STEPS = ["Register", "Courses", "Confirm"];

export default function StudentPortal() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState("signup");
  const [currentUser, setCurrentUser] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState([]);

  const stepIndex = step === "signup" ? 0 : step === "courses" ? 1 : 2;

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");

      if (!res.ok) {
        throw new Error("Could not load courses");
      }

      const json = await res.json();
      return json.data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students?include=courses");

      if (!res.ok) {
        return [];
      }

      const json = await res.json();
      return json.data;
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (values) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          courseIds: [],
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw {
          status: res.status,
          ...json,
        };
      }

      return json.data;
    },

    onSuccess: (student) => {
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      setCurrentUser(student);
      setEnrolledIds([]);
      setStep("courses");
    },

    onError: (err) => {
      if (err.status === 409) {
        setError("email", {
          message: "This email is already in use.",
        });
      } else if (err.error?.fields) {
        Object.entries(err.error.fields).forEach(([field, messages]) => {
          setError(field, {
            message: messages[0],
          });
        });
      } else {
        alert("Something went wrong. Please check your details.");
      }
    },
  });

  const toggleCourse = async (courseId) => {
    if (!currentUser) {
      return;
    }

    const isEnrolled = enrolledIds.includes(courseId);

    try {
      if (isEnrolled) {
        await fetch(`/api/students/${currentUser.id}/courses/${courseId}`, {
          method: "DELETE",
        });

        setEnrolledIds((prev) => prev.filter((id) => id !== courseId));
      } else {
        await fetch(`/api/students/${currentUser.id}/courses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
          }),
        });

        setEnrolledIds((prev) => [...prev, courseId]);
      }

      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
    } catch {
      alert("Failed to update course.");
    }
  };

  const onSubmitSignup = (data) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        message: "Passwords do not match",
      });

      return;
    }

    signupMutation.mutate(data);
  };

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}`
    : "";

  return (
    <div className="min-h-screen bg-[#f6f3ea] text-[#1c2340] flex flex-col items-center py-12 px-4 font-sans antialiased">
      <div className="w-full max-w-xl mx-auto">
        {/* Step rail — shared across all three screens */}
        <div className="flex items-center mb-10 px-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-[12px] font-medium rounded-full border ${
                    i < stepIndex
                      ? "bg-[#1c2340] border-[#1c2340] text-[#fdfcf8]"
                      : i === stepIndex
                      ? "bg-[#9c7a29] border-[#9c7a29] text-[#fdfcf8]"
                      : "bg-transparent border-[#c9c4b0] text-[#a19d8c]"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[11px] whitespace-nowrap ${
                    i === stepIndex ? "text-[#1c2340] font-medium" : "text-[#a19d8c]"
                  }`}
                >
                  {label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-3 mb-5 ${
                    i < stepIndex ? "bg-[#1c2340]" : "bg-[#d8d2bd]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === "signup" && (
          <div className="bg-[#fdfcf8] border border-[#e4dfd0] px-6 py-8 sm:px-12 sm:py-12">
            <div className="max-w-sm mb-9">
              <h1 className="text-[34px] sm:text-[40px] leading-[1.05] font-serif text-[#1c2340]">
                Create your account
              </h1>
              <p className="text-[13px] text-[#6b6858] mt-3">
                Enter your details to register as a student for the upcoming
                semester.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitSignup)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label className="block text-[12px] text-[#6b6858] mb-1.5">
                    First name
                  </label>

                  <input
                    type="text"
                    {...register("firstName", {
                      required: "First name is required",
                      minLength: {
                        value: 2,
                        message: "First name must be at least 2 characters",
                      },
                    })}
                    placeholder="Jordan"
                    className={`w-full bg-transparent text-[15px] pb-2 border-0 border-b ${
                      errors.firstName ? "border-[#a23b3b]" : "border-[#d8d2bd]"
                    } focus:outline-none focus:border-b-2 focus:border-[#9c7a29] transition-colors placeholder:text-[#b9b4a0]`}
                  />

                  {errors.firstName && (
                    <span className="text-[11px] text-[#a23b3b] mt-1 block">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] text-[#6b6858] mb-1.5">
                    Last name
                  </label>

                  <input
                    type="text"
                    {...register("lastName", {
                      required: "Last name is required",
                      minLength: {
                        value: 2,
                        message: "Last name must be at least 2 characters",
                      },
                    })}
                    placeholder="Rivera"
                    className={`w-full bg-transparent text-[15px] pb-2 border-0 border-b ${
                      errors.lastName ? "border-[#a23b3b]" : "border-[#d8d2bd]"
                    } focus:outline-none focus:border-b-2 focus:border-[#9c7a29] transition-colors placeholder:text-[#b9b4a0]`}
                  />

                  {errors.lastName && (
                    <span className="text-[11px] text-[#a23b3b] mt-1 block">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#6b6858] mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Enter a valid email",
                    },
                  })}
                  placeholder="jordan@school.edu"
                  className={`w-full bg-transparent text-[15px] pb-2 border-0 border-b ${
                    errors.email ? "border-[#a23b3b]" : "border-[#d8d2bd]"
                  } focus:outline-none focus:border-b-2 focus:border-[#9c7a29] transition-colors placeholder:text-[#b9b4a0]`}
                />

                {errors.email && (
                  <span className="text-[11px] text-[#a23b3b] mt-1 block">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label className="block text-[12px] text-[#6b6858] mb-1.5">
                    Password
                  </label>

                  <input
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    placeholder="At least 6 characters"
                    className={`w-full bg-transparent text-[15px] pb-2 border-0 border-b ${
                      errors.password ? "border-[#a23b3b]" : "border-[#d8d2bd]"
                    } focus:outline-none focus:border-b-2 focus:border-[#9c7a29] transition-colors placeholder:text-[#b9b4a0]`}
                  />

                  {errors.password && (
                    <span className="text-[11px] text-[#a23b3b] mt-1 block">
                      {errors.password.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] text-[#6b6858] mb-1.5">
                    Confirm password
                  </label>

                  <input
                    type="password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                    })}
                    placeholder="Retype your password"
                    className={`w-full bg-transparent text-[15px] pb-2 border-0 border-b ${
                      errors.confirmPassword
                        ? "border-[#a23b3b]"
                        : "border-[#d8d2bd]"
                    } focus:outline-none focus:border-b-2 focus:border-[#9c7a29] transition-colors placeholder:text-[#b9b4a0]`}
                  />

                  {errors.confirmPassword && (
                    <span className="text-[11px] text-[#a23b3b] mt-1 block">
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 pt-2">
                <p className="text-[12px] text-[#6b6858]">
                  Already a member?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (students.length > 0) {
                        const student = students[students.length - 1];

                        setCurrentUser(student);
                        setEnrolledIds(student.courseIds || []);
                        setStep("courses");
                      } else {
                        alert("No existing accounts found. Please sign up.");
                      }
                    }}
                    className="text-[#1c2340] font-semibold underline decoration-[#d8d2bd] underline-offset-2 hover:decoration-[#9c7a29]"
                  >
                    Sign in
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || signupMutation.isPending}
                  className="py-3 px-8 bg-[#1c2340] hover:bg-[#9c7a29] disabled:opacity-50 disabled:cursor-not-allowed text-[#fdfcf8] font-medium text-[13px] transition-colors shrink-0"
                >
                  {signupMutation.isPending ? "Creating…" : "Sign up"}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "courses" && (
          <div className="bg-[#fdfcf8] border border-[#e4dfd0] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 mb-6 border-b border-[#e4dfd0]">
              <div>
                <h1 className="text-[26px] sm:text-[30px] font-serif text-[#1c2340] leading-tight">
                  Welcome, {currentUser?.firstName}
                </h1>

                <p className="text-[13px] text-[#6b6858] mt-1.5 max-w-sm">
                  Choose the courses you would like to take this semester.
                </p>
              </div>

              <span className="text-[13px] text-[#9c7a29] font-serif italic whitespace-nowrap">
                {enrolledIds.length} of {courses.length} selected
              </span>
            </div>

            {loadingCourses ? (
              <p className="text-[13px] text-[#a19d8c] py-14 text-center italic">
                Loading course list…
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((c) => {
                  const selected = enrolledIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCourse(c.id)}
                      className={`p-4 cursor-pointer flex flex-col gap-3 border transition-colors ${
                        selected
                          ? "bg-[#faf5e6] border-[#9c7a29]"
                          : "border-[#e4dfd0] hover:border-[#c9c4b0]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-[#9c7a29] font-mono tracking-wide pt-0.5">
                          {c.code}
                        </span>

                        <div
                          className={`w-4 h-4 shrink-0 flex items-center justify-center text-[10px] border ${
                            selected
                              ? "bg-[#9c7a29] border-[#9c7a29] text-[#fdfcf8]"
                              : "border-[#c9c4b0] text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[15px] font-medium text-[#1c2340] leading-snug">
                          {c.title}
                        </h3>

                        <p className="text-[12px] text-[#6b6858] mt-1">
                          {c.instructor} &middot; {c.credits} credits
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-8 mt-2 gap-4">
              <button
                type="button"
                onClick={() => setStep("signup")}
                className="text-[12px] text-[#6b6858] hover:text-[#1c2340]"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => setStep("summary")}
                className="py-3 px-8 bg-[#1c2340] text-[#fdfcf8] text-[12px] font-medium hover:bg-[#9c7a29] transition-colors"
              >
                Save &amp; view profile
              </button>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="bg-[#fdfcf8] border border-[#e4dfd0] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#e4dfd0]">
              <div className="w-12 h-12 shrink-0 rounded-full bg-[#3f6b4a] text-[#fdfcf8] flex items-center justify-center text-[15px] font-serif">
                {initials || "✓"}
              </div>

              <div>
                <h1 className="text-[24px] font-serif text-[#1c2340] leading-tight">
                  Registration complete
                </h1>
                <p className="text-[13px] text-[#6b6858] mt-1">
                  You are enrolled for the upcoming academic session.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <span className="text-[11px] text-[#9c7a29] block mb-3">
                  Student details
                </span>

                <div className="space-y-3 text-[13px]">
                  <div>
                    <span className="text-[#6b6858] block">Name</span>
                    <span className="font-medium text-[#1c2340]">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#6b6858] block">Email</span>
                    <span className="font-medium text-[#1c2340] break-all">
                      {currentUser?.email}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#9c7a29] block mb-3">
                  Enrolled courses ({enrolledIds.length})
                </span>

                <div className="space-y-2.5">
                  {courses
                    .filter((c) => enrolledIds.includes(c.id))
                    .map((c) => (
                      <div key={c.id} className="text-[13px]">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-[#1c2340]">
                            {c.title}
                          </span>
                          <span className="text-[#6b6858] shrink-0">
                            {c.credits} cr
                          </span>
                        </div>
                        <span className="text-[11px] text-[#9c7a29] font-mono">
                          {c.code}
                        </span>
                      </div>
                    ))}

                  {enrolledIds.length === 0 && (
                    <span className="text-[#a19d8c] italic text-[13px]">
                      No courses selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-8 mt-6 border-t border-[#e4dfd0]">
              <button
                type="button"
                onClick={() => setStep("courses")}
                className="flex-1 py-3 border border-[#d8d2bd] text-[#1c2340] text-[12px] font-medium hover:bg-[#f6f3ea] transition-colors"
              >
                Change courses
              </button>

              <button
                type="button"
                onClick={() => setStep("signup")}
                className="flex-1 py-3 bg-[#9c7a29] text-[#fdfcf8] text-[12px] font-medium hover:bg-[#1c2340] transition-colors"
              >
                Register another student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}