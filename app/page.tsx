"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronRight, FileText, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { scanResumeServer } from "./actions";

const universitySuggestions = [
  "Arkansas State University",
  "Arizona State University",
  "Auburn University",
  "Baylor University",
  "Georgia Institute of Technology",
  "Kansas State University",
  "Massachusetts Institute of Technology",
  "Michigan State University",
  "Missouri State University",
  "New York University",
  "Ohio State University",
  "Oklahoma State University",
  "Pennsylvania State University",
  "Purdue University",
  "Texas A&M University",
  "Texas Tech University",
  "University of Alabama",
  "University of Arkansas",
  "University of Arkansas at Little Rock",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of Central Arkansas",
  "University of Georgia",
  "University of Houston",
  "University of Kansas",
  "University of Memphis",
  "University of Missouri",
  "University of North Texas",
  "University of Oklahoma",
  "University of Southern California",
  "University of Tennessee",
  "University of Texas at Austin",
  "University of Texas at Dallas",
];

const universityAliases: Record<string, string[]> = {
  "Georgia Institute of Technology": ["Georgia Tech", "GT"],
  "Massachusetts Institute of Technology": ["MIT"],
  "New York University": ["NYU"],
  "Ohio State University": ["OSU"],
  "Pennsylvania State University": ["Penn State"],
  "Texas A&M University": ["TAMU", "Texas A and M"],
  "University of Arkansas": ["UARK", "U of A"],
  "University of California, Berkeley": ["UC Berkeley", "Cal"],
  "University of California, Los Angeles": ["UCLA"],
  "University of Georgia": ["UGA"],
  "University of Missouri": ["Mizzou"],
  "University of Southern California": ["USC"],
  "University of Texas at Austin": ["UT Austin", "UT"],
  "University of Texas at Dallas": ["UTD"],
};

const majorSuggestions = [
  "Accounting",
  "Business Administration",
  "Business Analytics",
  "Chemical Engineering",
  "Civil Engineering",
  "Communications",
  "Computer Engineering",
  "Computer Science",
  "Cybersecurity",
  "Data Science",
  "Economics",
  "Electrical Engineering",
  "Finance",
  "Human Resources",
  "Industrial Engineering",
  "Information Systems",
  "Information Technology",
  "Logistics",
  "Management",
  "Marketing",
  "Mathematics",
  "Mechanical Engineering",
  "Operations Management",
  "Psychology",
  "Software Engineering",
  "Supply Chain Management",
];

function SuggestionField({
  id,
  label,
  value,
  onChange,
  options,
  aliases,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  aliases?: Record<string, string[]>;
  placeholder: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const optionTouch = useRef<{ id: number; x: number; y: number } | null>(null);
  const query = value.trim().toLowerCase();
  const searchRank = (option: string) => {
    const name = option.toLowerCase();
    if (name === query) return 0;

    const initials = aliases
      ? option.match(/[a-z]+/gi)?.filter(word => !["of", "at", "the", "and"].includes(word.toLowerCase())).map(word => word[0]).join("").toLowerCase()
      : undefined;
    const shortForms = [initials, ...(aliases?.[option] ?? [])].filter((term): term is string => Boolean(term)).map(term => term.toLowerCase());

    if (shortForms.some(term => term === query)) return 0;
    if (name.startsWith(query)) return 1;
    if (query.length > 1 && shortForms.some(term => term.startsWith(query))) return 2;
    return name.includes(query) ? 3 : Infinity;
  };
  const matches = query
    ? options.map(option => ({ option, rank: searchRank(option) }))
        .filter(result => Number.isFinite(result.rank))
        .sort((a, b) => a.rank - b.rank || a.option.localeCompare(b.option))
        .slice(0, 6)
        .map(result => result.option)
    : options;
  const showSuggestions = open && !disabled && matches.length > 0;
  const listId = `${id}-suggestions`;

  const chooseOption = (option: string) => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div
      className="flex min-w-0 flex-col group"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <label htmlFor={id} className="text-[11px] sm:text-xs font-bold text-jbh-black uppercase tracking-wide mb-1 group-focus-within:text-jbh-black transition-colors">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={event => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={event => {
          if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          } else if (showSuggestions && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(index => (index + 1) % matches.length);
          } else if (showSuggestions && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(index => index <= 0 ? matches.length - 1 : index - 1);
          } else if (showSuggestions && event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            chooseOption(matches[activeIndex]);
          }
        }}
        disabled={disabled}
        required
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={listId}
        aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        placeholder={placeholder}
        className="w-full bg-[#f9f9f9] border border-[#A0A0A0] rounded-sm px-4 py-3 sm:py-3.5 text-base sm:text-sm text-jbh-black placeholder:text-jbh-black/50 focus:outline-none focus:border-jbh-black focus:ring-1 focus:ring-jbh-black transition-all peer"
      />
      {showSuggestions && (
        <div id={listId} role="listbox" aria-label={`${label} suggestions`} className="mt-1 max-h-52 overflow-y-auto rounded-sm border-l-4 border-jbh-yellow bg-jbh-black py-1">
          {matches.map((option, index) => (
            <button
              id={`${id}-option-${index}`}
              key={option}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={activeIndex === index}
              // Keep focus on the input until click selects the option. Mobile
              // browsers can otherwise blur it and remove the list before click.
              onPointerDown={event => {
                event.preventDefault();
                optionTouch.current = event.pointerType === "mouse" ? null : {
                  id: event.pointerId, x: event.clientX, y: event.clientY,
                };
              }}
              onPointerCancel={() => { optionTouch.current = null; }}
              onPointerUp={event => {
                const touch = optionTouch.current;
                optionTouch.current = null;
                // Safari may suppress click after a cancelled pointerdown.
                // Select only a completed tap; scrolling cancels the pointer.
                if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) < 10) {
                  event.preventDefault();
                  chooseOption(option);
                }
              }}
              onMouseDown={event => event.preventDefault()}
              onPointerMove={event => {
                if (event.pointerType === "mouse") setActiveIndex(index);
              }}
              onClick={() => chooseOption(option)}
              className={`block min-h-11 w-full touch-manipulation px-4 py-2.5 text-left text-base sm:text-sm font-semibold transition-colors ${activeIndex === index ? "bg-jbh-yellow text-jbh-black" : "text-white hover:bg-jbh-yellow hover:text-jbh-black"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


type ResumeSelection = { file: File; source: "upload" | "scan" };

function ResumeInput({ disabled, onChange }: { disabled: boolean; onChange: (resume: ResumeSelection | null) => void }) {
  const [mode, setMode] = useState<"upload" | "scan">("upload");
  const [selection, setSelection] = useState<ResumeSelection | null>(null);
  const [warning, setWarning] = useState("");
  const [scanning, setScanning] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [text, setText] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const liveStream = useRef<MediaStream | null>(null);
  const request = useRef(0);
  const busy = disabled || scanning || openingCamera;

  const stopCamera = useCallback(() => {
    liveStream.current?.getTracks().forEach(track => track.stop());
    liveStream.current = null;
    setStream(null);
    setCameraReady(false);
  }, []);

  useEffect(() => () => {
    request.current++;
    liveStream.current?.getTracks().forEach(track => track.stop());
  }, []);
  useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream;
  }, [stream]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const reset = () => {
    request.current++;
    stopCamera();
    setSelection(null);
    onChange(null);
    setWarning("");
    setText("");
    setPhotoUrl("");
  };

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const next: ResumeSelection = { file: files[0], source: "upload" };
    setSelection(next);
    setWarning("");
    onChange(next);
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: () => {
      setSelection(null);
      onChange(null);
      setWarning("Resume must be a PDF or DOCX file no larger than 8 MB.");
    },
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    maxSize: 8 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
    disabled: busy,
  });

  const scan = (photo: File) => {
    stopCamera();
    setSelection(null);
    onChange(null);
    setText("");
    setWarning("");
    setPhotoUrl("");
    if (!["image/jpeg", "image/png"].includes(photo.type) || !photo.size || photo.size > 8 * 1024 * 1024) {
      setWarning("The captured photo is too large. Retake the photo or upload a PDF or DOCX up to 8 MB.");
      return;
    }
    setPhotoUrl(URL.createObjectURL(photo));
    setScanning(true);
    const current = ++request.current;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("photo", photo);
        const result = await scanResumeServer(formData);
        if (request.current !== current) return;
        if (!result.success) { setWarning(result.error); return; }
        const bytes = Uint8Array.from(atob(result.pdf), character => character.charCodeAt(0));
        const next: ResumeSelection = {
          file: new File([bytes], "scanned-resume.pdf", { type: "application/pdf" }),
          source: "scan",
        };
        setSelection(next);
        setText(result.text);
        onChange(next);
      } catch {
        if (request.current === current) setWarning("Text extraction failed. Check your connection, then retake the photo or upload your resume.");
      } finally {
        if (request.current === current) setScanning(false);
      }
    });
  };

  const openCamera = async () => {
    reset();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setWarning("Camera access requires HTTPS or localhost. Upload a PDF or DOCX instead.");
      return;
    }
    setOpeningCamera(true);
    const current = request.current;
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 2400 }, height: { ideal: 3200 } }, audio: false });
      if (request.current !== current) { next.getTracks().forEach(track => track.stop()); return; }
      liveStream.current = next;
      setStream(next);
    } catch {
      if (request.current === current) setWarning("Camera access was denied or no camera is available. Allow camera access and try Scan resume again, or upload your resume.");
    } finally {
      if (request.current === current) setOpeningCamera(false);
    }
  };

  const capture = async () => {
    if (!video.current || !cameraReady) return;
    const current = request.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) { setWarning("The camera is not ready. Please try again."); return; }
    context.drawImage(video.current, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.95));
    if (request.current !== current || !liveStream.current) return;
    if (!blob) { setWarning("The photo could not be captured. Please try again."); return; }
    scan(new File([blob], "resume-photo.jpg", { type: "image/jpeg" }));
  };

  const buttonClass = "inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-sm border border-jbh-black px-3 py-3 text-xs min-[400px]:text-sm sm:text-sm font-bold touch-manipulation [&>svg]:shrink-0 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <fieldset className="min-w-0 pt-4" disabled={disabled}>
      <legend className="mb-2 w-full text-xs font-bold uppercase tracking-wide">Resume <span className="float-right normal-case">Required</span></legend>
      <input {...getInputProps()} />
      <div className="mb-3 grid grid-cols-1 min-[360px]:grid-cols-2 gap-2" role="group" aria-label="Resume method">
        {(["upload", "scan"] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} disabled={busy} onClick={() => {
            setMode(value);
            if (value === "scan") void openCamera();
            else { reset(); open(); }
          }} className={`${buttonClass} ${mode === value ? "bg-jbh-black text-white" : "bg-white text-jbh-black"}`}>
            {value === "upload" ? <UploadCloud size={18} /> : <Camera size={18} />}
            {value === "upload" ? "Upload resume" : "Scan resume"}
          </button>
        ))}
      </div>

      {mode === "upload" && !selection && (
        <div {...getRootProps()} aria-label="Upload PDF or DOCX resume" className={`rounded-sm border-2 border-dashed p-4 text-center ${isDragActive ? "border-jbh-black bg-jbh-yellow/10" : "border-[#A0A0A0] bg-[#f9f9f9]"}`}>
          <p className="text-sm">{isDragActive ? "Drop your resume here" : "Upload a PDF or DOCX, or drag it here."}</p>
          <p className="mt-1 text-xs text-jbh-black/70">Up to 8 MB.</p>
        </div>
      )}

      {mode === "scan" && (
        <div className="space-y-3 rounded-sm border border-jbh-gray bg-[#f9f9f9] p-4">
          <p className="text-sm leading-relaxed">Fit the whole page in the frame. Use good lighting and avoid glare.</p>
          <p className="text-xs text-jbh-black/70">One English page. Submission requires readable text.</p>
          {stream && (
            <div className="space-y-2">
              <video ref={video} autoPlay muted playsInline onLoadedData={() => setCameraReady(true)} className="max-h-[50dvh] sm:max-h-96 w-full rounded-sm bg-black object-contain" aria-label="Resume camera preview" />
              <div className="flex gap-2">
                <button type="button" onClick={capture} disabled={busy || !cameraReady} className={`${buttonClass} flex-1 bg-jbh-yellow`}><Camera size={18} /> Capture page</button>
                <button type="button" onClick={stopCamera} disabled={busy} className={buttonClass}>Cancel</button>
              </div>
            </div>
          )}
          {photoUrl && <Image src={photoUrl} alt="Captured resume page" width={600} height={800} unoptimized className="max-h-72 w-full rounded-sm object-contain" />}
          {!stream && photoUrl && (
            <div>
              <button type="button" onClick={openCamera} disabled={busy} className={`${buttonClass} bg-jbh-yellow`}>
                <Camera size={18} /> Retake photo
              </button>
            </div>
          )}
          {openingCamera && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={18} className="animate-spin" /> Opening camera…</p>}
          {scanning && <p role="status" className="flex items-center gap-2 text-sm font-semibold"><Loader2 size={18} className="animate-spin" /> Checking photo and extracting text…</p>}
          {text && (
            <div className="space-y-2">
              <p role="status" className="flex items-center gap-2 text-sm font-semibold text-green-800"><CheckCircle2 size={18} /> Text extracted. Your searchable PDF is ready.</p>
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold">Review extracted text</summary>
                <p className="mt-2 text-xs text-jbh-black/70">Check names and contact details. If text is missing or incorrect, retake the photo or upload your original resume.</p>
                <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-jbh-gray bg-white p-3 font-sans text-xs">{text}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      {selection && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-sm border-2 border-jbh-black bg-jbh-yellow/5 p-3">
          <FileText size={22} className="shrink-0" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{selection.file.name}</p><p className="text-xs text-jbh-black/70">{(selection.file.size / 1024 / 1024).toFixed(1)} MB</p></div>
          <button type="button" aria-label="Remove resume" onClick={reset} disabled={busy} className="flex min-h-11 min-w-11 items-center justify-center p-2 touch-manipulation"><X size={18} /></button>
        </div>
      )}
      {warning && <p role="alert" className="mt-3 rounded-sm border border-amber-400 bg-amber-50 p-3 text-sm font-medium text-amber-950">{warning}{mode === "scan" && !selection && " Submission is blocked until a scan passes or you upload a resume."}</p>}
    </fieldset>
  );
}


function SuccessScreen({ onReturn }: { onReturn: () => void }) {


  return (
    <div className="min-h-dvh bg-jbh-lightgray font-sans flex flex-col">

      {/* Top Nav */}
      <nav className="w-full bg-white z-50 flex items-center justify-start px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b-4 border-jbh-yellow">
        <Link href="/" className="bg-jbh-yellow text-jbh-black font-heading font-extrabold px-3 py-1 text-base sm:text-xl tracking-tighter">
          TalentIQ
        </Link>
      </nav>

      {/* Main Area */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-0 sm:p-8 mt-6 sm:mt-0">
        <div className="w-full max-w-2xl bg-white sm:border-t-8 border-t-4 border-jbh-yellow shadow-none sm:shadow-2xl ring-0 sm:ring-1 sm:ring-black/5 px-6 py-8 sm:p-24 flex flex-col items-center text-center rounded-none sm:rounded-md">

          <div className="mb-6 sm:mb-12">
            <CheckCircle2 strokeWidth={2} className="w-16 h-16 sm:w-24 sm:h-24 text-jbh-yellow" />
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold uppercase text-jbh-black tracking-tight mb-4 sm:mb-8">
            Check-In Complete
          </h1>

          <p className="text-base sm:text-xl text-jbh-black/50 leading-relaxed mb-8 sm:mb-20 max-w-lg">
            You have completed the form. Thank you for checking in.
          </p>

          <button
            onClick={onReturn}
            className="w-full max-w-sm bg-jbh-black text-white uppercase text-sm sm:text-base font-extrabold px-8 py-4 sm:py-5 rounded-sm hover:bg-jbh-black/90 hover:tracking-wide transition-all flex items-center justify-center gap-2 group shadow-md active:scale-[0.98]"
          >
            Return to Home <ChevronRight strokeWidth={2.5} className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckinPage() {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [resume, setResume] = useState<ResumeSelection | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume) {
      setStatus("error");
      setErrorMessage("Please upload your resume or complete a readable scan before submitting.");
      return;
    }
    setStatus("submitting");
    setErrorMessage("");

    if (![firstName, lastName, email, university, major].every(value => value.trim())) {
      setStatus("error");
      setErrorMessage("Please complete all required fields.");
      return;
    }
    setStatus("success");
  };

  if (status === "success") return <SuccessScreen onReturn={() => window.location.reload()} />;

  return (
    <div className="min-h-dvh bg-jbh-lightgray font-sans flex flex-col">

      {/* Top Nav (Corporate style) */}
      <nav className="w-full bg-white z-50 flex items-center justify-start px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b-4 border-jbh-yellow">
        <Link href="/" className="bg-jbh-yellow text-jbh-black font-heading font-extrabold px-3 py-1 text-lg sm:text-xl tracking-tighter">
          TalentIQ
        </Link>
      </nav>

      {/* Main Form Area */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-0 sm:p-6 lg:p-8">
        <div className="w-full min-w-0 max-w-4xl bg-white border-x-0 sm:border border-jbh-gray shadow-none sm:shadow-xl flex flex-col md:flex-row overflow-hidden rounded-none sm:rounded-md">

          {/* Side Banner */}
          <div className="bg-jbh-black text-white p-5 sm:p-10 md:p-12 md:w-2/5 flex flex-col justify-start text-center md:text-left">
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold uppercase mb-3 sm:mb-6 leading-none tracking-tight">
                Join the <br className="hidden md:block" />
                <span className="text-jbh-yellow"> Fleet.</span>
              </h2>
              <div className="w-12 sm:w-16 h-1.5 bg-jbh-yellow mb-3 sm:mb-8 mx-auto md:mx-0"></div>
              <p className="text-sm sm:text-base text-jbh-lightgray/90 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
                Provide your details and resume to complete the career fair check-in form.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="min-w-0 p-5 sm:p-10 md:p-12 md:w-3/5">
            {/* Added -mt-2 to pull the form UP slightly to perfectly align with the text ascenders of the heading on the left */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 sm:-mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex min-w-0 flex-col relative group">
                  <label className="text-[11px] sm:text-xs font-bold text-jbh-black uppercase tracking-wide mb-1 group-focus-within:text-jbh-black transition-colors" htmlFor="first-name">First Name</label>
                  <input
                    id="first-name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={status === "submitting"}
                    required
                    className="w-full bg-[#f9f9f9] border border-[#A0A0A0] rounded-sm px-4 py-3 sm:py-3.5 text-base sm:text-sm text-jbh-black placeholder:text-jbh-black/50 focus:outline-none focus:border-jbh-black focus:ring-1 focus:ring-jbh-black transition-all peer"
                  />
                </div>
                <div className="flex min-w-0 flex-col relative group">
                  <label className="text-[11px] sm:text-xs font-bold text-jbh-black uppercase tracking-wide mb-1 group-focus-within:text-jbh-black transition-colors" htmlFor="last-name">Last Name</label>
                  <input
                    id="last-name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={status === "submitting"}
                    required
                    className="w-full bg-[#f9f9f9] border border-[#A0A0A0] rounded-sm px-4 py-3 sm:py-3.5 text-base sm:text-sm text-jbh-black placeholder:text-jbh-black/50 focus:outline-none focus:border-jbh-black focus:ring-1 focus:ring-jbh-black transition-all peer"
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-col relative group">
                <label className="text-[11px] sm:text-xs font-bold text-jbh-black uppercase tracking-wide mb-1 group-focus-within:text-jbh-black transition-colors" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                  required
                  className="w-full bg-[#f9f9f9] border border-[#A0A0A0] rounded-sm px-4 py-3 sm:py-3.5 text-base sm:text-sm text-jbh-black placeholder:text-jbh-black/50 focus:outline-none focus:border-jbh-black focus:ring-1 focus:ring-jbh-black transition-all peer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <SuggestionField id="university" label="University" value={university} onChange={setUniversity} options={universitySuggestions} aliases={universityAliases} placeholder="Enter your university" disabled={status === "submitting"} />
                <SuggestionField id="major" label="Major" value={major} onChange={setMajor} options={majorSuggestions} placeholder="Enter your major" disabled={status === "submitting"} />
              </div>

              <ResumeInput disabled={status === "submitting"} onChange={setResume} />

              {status === "error" && (
                <div role="alert" className="text-red-500 text-sm font-medium mt-2">
                  {errorMessage}
                </div>
              )}

              {/* Added pt-10 to increase breathing room above the submit button */}
              <div className="pt-4 sm:pt-10 pb-2 sm:pb-0">
                <button
                  type="submit"
                  disabled={!resume || status === "submitting"}
                  className="w-full bg-jbh-yellow text-jbh-black uppercase text-base font-extrabold px-8 py-4 rounded-sm hover:bg-jbh-black hover:text-jbh-yellow hover:tracking-wide transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-md active:scale-[0.98]"
                >
                  {status === "submitting" ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Submit <ChevronRight strokeWidth={2.5} className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
