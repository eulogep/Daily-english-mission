"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Pause, Play, RotateCcw, Save, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localAudioEvidenceService, loadAudioUrl } from "@/modules/technical-english/audio-store";
import { microphoneErrorMessage, validateAudioBlob } from "@/modules/technical-english/core";
import type { AudioEvidenceReference, AudioRecordingState } from "@/modules/technical-english/types";

const MAX_RECORDING_SECONDS = 90;

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function AudioResponse({ existing, disabled = false, onSaved, onDeleted, onEvent, onFallback }: {
  existing: AudioEvidenceReference | null;
  disabled?: boolean;
  onSaved: (reference: AudioEvidenceReference) => void;
  onDeleted: () => void;
  onEvent: (type: "AUDIO_RECORDING_STARTED" | "AUDIO_RECORDING_COMPLETED" | "AUDIO_RECORDING_RETRIED" | "AUDIO_PLAYED", value?: number) => void;
  onFallback: () => void;
}) {
  const [state, setState] = useState<AudioRecordingState>(existing ? "SAVED" : "READY");
  const [durationMs, setDurationMs] = useState(existing?.durationMs ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; }, []);
  const stopStream = useCallback(() => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }, []);
  const clearUrl = useCallback(() => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); }, [audioUrl]);

  useEffect(() => () => { clearTimer(); stopStream(); if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl, clearTimer, stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }, []);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("ERROR");
      setError("L’enregistrement audio n’est pas pris en charge par ce navigateur. Utilise la réponse écrite.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        clearTimer();
        stopStream();
        const finalDurationMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
        const recorded = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const validationError = validateAudioBlob(recorded);
        if (validationError) { setState("ERROR"); setError(validationError); return; }
        clearUrl();
        setBlob(recorded);
        setDurationMs(finalDurationMs);
        setAudioUrl(URL.createObjectURL(recorded));
        setState("RECORDED");
        onEvent("AUDIO_RECORDING_COMPLETED", finalDurationMs);
      };
      recorder.start(500);
      startedAtRef.current = Date.now();
      setDurationMs(0);
      setState("RECORDING");
      onEvent("AUDIO_RECORDING_STARTED");
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
        setDurationMs(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS * 1000) stopRecording();
      }, 250);
    } catch (caught) {
      stopStream();
      setState("ERROR");
      setError(microphoneErrorMessage(caught));
    }
  }

  async function save() {
    if (!blob) return;
    setError(null);
    try {
      const reference = await localAudioEvidenceService.save(blob, durationMs);
      onSaved(reference);
      setState("SAVED");
    } catch (caught) {
      setState("ERROR");
      setError(caught instanceof Error ? caught.message : "L’audio n’a pas pu être enregistré localement.");
    }
  }

  async function discard(retry: boolean) {
    if (existing) await localAudioEvidenceService.remove(existing).catch(() => undefined);
    clearUrl();
    setBlob(null);
    setDurationMs(0);
    setError(null);
    setState("READY");
    onDeleted();
    if (retry) onEvent("AUDIO_RECORDING_RETRIED");
  }

  async function replay() {
    setError(null);
    let playableUrl = audioUrl;
    if (!playableUrl && existing) {
      setLoadingAudio(true);
      try {
        playableUrl = await loadAudioUrl(existing);
        if (!playableUrl) {
          setState("ERROR");
          setError("L’enregistrement local est introuvable. Tu peux recommencer ou écrire ta réponse.");
          return;
        }
        setAudioUrl(playableUrl);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      } catch {
        setState("ERROR");
        setError("L’enregistrement local n’a pas pu être relu.");
        return;
      } finally {
        setLoadingAudio(false);
      }
    }
    if (!audioRef.current || !playableUrl) return;
    try {
      await audioRef.current.play();
      setState("PLAYING");
      onEvent("AUDIO_PLAYED");
    } catch {
      setState("ERROR");
      setError("La lecture audio n’a pas pu démarrer. Tu peux réessayer ou écrire ta réponse.");
    }
  }

  return <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Microphone</p><p aria-live="polite" className="mt-1 text-sm text-slate-600">État : {state === "READY" ? "prêt" : state === "RECORDING" ? "enregistrement en cours" : state === "RECORDED" ? "enregistré, pas encore sauvegardé" : state === "PLAYING" ? "lecture en cours" : state === "SAVED" ? "sauvegardé localement" : "erreur"}</p></div><span className="font-mono text-2xl font-semibold">{formatDuration(durationMs)}</span></div>
    {state === "RECORDING" && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><span className="size-3 animate-pulse rounded-full bg-rose-600" aria-hidden="true" />Enregistrement actif — le microphone est utilisé</div>}
    {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setState(existing ? "SAVED" : "RECORDED")} controls className="w-full" aria-label="Réécouter la réponse enregistrée" />}
    <div className="flex flex-wrap gap-2">
      {(state === "READY" || state === "ERROR") && <Button type="button" onClick={startRecording} disabled={disabled}><Mic />Enregistrer</Button>}
      {state === "RECORDING" && <Button type="button" variant="destructive" onClick={stopRecording}><Square />Arrêter</Button>}
      {(state === "RECORDED" || state === "SAVED" || state === "PLAYING") && <Button type="button" variant="outline" onClick={replay} disabled={loadingAudio || (!audioUrl && !existing)}>{loadingAudio ? <Loader2 className="animate-spin" /> : state === "PLAYING" ? <Pause /> : <Play />}{loadingAudio ? "Chargement…" : "Réécouter"}</Button>}
      {state === "RECORDED" && <Button type="button" onClick={save}><Save />Sauvegarder localement</Button>}
      {(state === "RECORDED" || state === "SAVED") && <Button type="button" variant="outline" onClick={() => void discard(true)}><RotateCcw />Recommencer</Button>}
      {(state === "RECORDED" || state === "SAVED" || state === "ERROR") && <Button type="button" variant="ghost" onClick={() => void discard(false)}><Trash2 />Supprimer</Button>}
    </div>
    {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{error}</p><Button type="button" variant="link" className="mt-2 h-auto p-0 text-amber-950" onClick={onFallback}>Écrire ma réponse à la place</Button></div>}
    <p className="text-xs leading-5 text-slate-500">Audio personnel · stockage sur cet appareil uniquement · aucun envoi externe.</p>
  </div>;
}
