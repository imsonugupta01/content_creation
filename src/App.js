import React, { useMemo, useRef, useState } from "react";
import { api as PRESET_APIS } from "./Api_file.js";

const API_URL = "https://api.json2video.com/v2";

const makeId = () =>
  window.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function compressImage(file) {
  try {
    if (!file.type.startsWith("image/")) return file;
    const bitmap = await createImageBitmap(file);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function prepareNarration(text) {
  const escaped = text
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const naturalText = escaped
    .replace(/\n{2,}/g, ' <break time="450ms"/> ')
    .replace(/\n/g, ' <break time="300ms"/> ')
    .replace(/([।!?])\s*/g, '$1 <break time="400ms"/> ')
    .replace(/,\s*/g, ', <break time="160ms"/> ');

  return `<speak><prosody rate="-5%">${naturalText}</prosody></speak>`;
}

export default function App() {
  const [selectedApiName, setSelectedApiName] = useState(
    PRESET_APIS && PRESET_APIS.length > 0 ? PRESET_APIS[0].name : "custom"
  );
  const [customApiKey, setCustomApiKey] = useState("");
  const [story, setStory] = useState("");
  const [images, setImages] = useState([]);
  const [voice, setVoice] = useState("hi-IN-MadhurNeural");
  const [format, setFormat] = useState("vertical");
  const [subtitles, setSubtitles] = useState(true);
  const [duration, setDuration] = useState(5);
  const [transition, setTransition] = useState("fade");
  const [motion, setMotion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);

  const apiKey = useMemo(() => {
    if (selectedApiName === "custom") return customApiKey;
    const found = (PRESET_APIS || []).find((a) => a.name === selectedApiName);
    return found?.value || "";
  }, [selectedApiName, customApiKey]);

  const estimatedSpeech = story.trim()
    ? Math.ceil(story.trim().split(/\s+/).length / 2.5)
    : 0;

  const sceneDuration = Math.max(
    Number(duration),
    images.length ? Math.ceil(estimatedSpeech / images.length) : Number(duration)
  );

  const estimatedDuration = images.length * sceneDuration;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const estimatedUploadSize = useMemo(
    () => images.reduce((sum, item) => sum + item.file.size, 0),
    [images]
  );

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        return false;
      }
      if (file.size > 500 * 1024 * 1024) {
        setError(`${file.name} is larger than 500 MB.`);
        return false;
      }
      return true;
    });
    const newImages = validFiles.map((file) => ({
      id: makeId(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((previous) => [...previous, ...newImages]);
    setError("");
    setVideoUrl("");
    event.target.value = "";
  };

  const removeImage = (id) => {
    setImages((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return previous.filter((item) => item.id !== id);
    });
    setVideoUrl("");
  };

  const moveImage = (index, direction) => {
    setImages((previous) => {
      const updated = [...previous];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return previous;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
    setVideoUrl("");
  };

  const clearImages = () => {
    images.forEach((item) => URL.revokeObjectURL(item.preview));
    setImages([]);
    setVideoUrl("");
  };

  const uploadImage = async (originalFile, index) => {
    setStatus(`Compressing and uploading image ${index + 1}...`);
    const file = await compressImage(originalFile);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${makeId()}-${safeName}`;

    const response = await fetch(`${API_URL}/media/file`, {
      method: "POST",
      headers: { "x-api-key": apiKey.trim(), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: uniqueName,
        contentType: file.type,
        size: file.size,
        folder: "movie-images",
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `Could not prepare image ${index + 1}.`);
    }
    if (!data.uploadUrl || !data.fileUrl) {
      throw new Error("Upload URL was not returned.");
    }
    const uploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error(`Image ${index + 1} upload failed.`);
    return data.fileUrl;
  };

  const createMovieData = (uploadedUrls) => {
    const resolution =
      format === "vertical"
        ? "instagram-story"
        : format === "square"
        ? "squared"
        : "full-hd";

    const panDirections = ["right", "left", "top", "bottom"];

    const scenes = uploadedUrls.map((url, index) => {
      const imageElement = {
        type: "image",
        src: url,
        duration: sceneDuration,
        resize: "cover",
        position: "center-center",
      };
      if (motion) {
        imageElement.zoom = index % 2 === 0 ? 3 : -3;
        imageElement.pan = panDirections[index % panDirections.length];
      }
      const scene = { duration: sceneDuration, elements: [imageElement] };
      if (index > 0 && transition !== "none") {
        scene.transition = { type: "xfade", style: transition, duration: 0.5 };
      }
      return scene;
    });

    const elements = [];
    if (story.trim()) {
      elements.push({
        type: "voice",
        model: "azure",
        voice,
        text: prepareNarration(story),
        speed: 1,
        cache: true,
      });
    }
    if (subtitles && story.trim()) {
      elements.push({
        type: "subtitles",
        language: "hi",
        model: "default",
        settings: {
          style: "classic",
          position: "bottom-center",
          "font-size": 60,
          "max-words-per-line": 6,
        },
      });
    }
    return { resolution, quality: "high", scenes, elements };
  };

  const generateVideo = async () => {
    if (!apiKey.trim()) {
      setError(
        selectedApiName === "custom"
          ? "Please enter your JSON2Video API key."
          : "Selected API has no key configured."
      );
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    if (estimatedDuration > 60) {
      setError(`Estimated movie duration is ${estimatedDuration}s. Limit is 60s.`);
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");
    setProgress(0);

    try {
      const uploadedUrls = [];
      const batchSize = 3;

      for (let start = 0; start < images.length; start += batchSize) {
        const batch = images.slice(start, start + batchSize);
        setStatus(`Uploading images ${start + 1}–${start + batch.length} of ${images.length}...`);
        const batchUrls = await Promise.all(
          batch.map((item, index) => uploadImage(item.file, start + index))
        );
        uploadedUrls.push(...batchUrls);
        setProgress(Math.round((uploadedUrls.length / images.length) * 40));
      }

      setStatus("Images uploaded. Creating your movie...");
      setProgress(42);

      const movieData = createMovieData(uploadedUrls);

      const response = await fetch(`${API_URL}/movies`, {
        method: "POST",
        headers: { "x-api-key": apiKey.trim(), "Content-Type": "application/json" },
        body: JSON.stringify(movieData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Movie creation failed.");
      const projectId = data.project;
      if (!projectId) throw new Error("Movie project ID not received.");

      setStatus("Rendering your Reel...");
      setProgress(45);

      for (let i = 0; i < 120; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const result = await fetch(
          `${API_URL}/movies?project=${encodeURIComponent(projectId)}`,
          { headers: { "x-api-key": apiKey.trim() } }
        );
        const resultData = await result.json();
        if (!result.ok || !resultData.success) throw new Error(resultData.message || "Status check failed.");
        const movie = resultData.movie;
        if (!movie) throw new Error("Movie details not received.");
        if (movie.status === "done") {
          if (!movie.url) throw new Error("Video URL not received.");
          setVideoUrl(movie.url);
          setProgress(100);
          setStatus("Your movie is ready! 🎬");
          return;
        }
        if (movie.status === "error" || movie.status === "timeout") {
          throw new Error(movie.message || "Movie rendering failed.");
        }
        setProgress(Math.min(45 + Math.round((i / 120) * 55), 99));
        setStatus(`Rendering your movie... ${i + 1}/120`);
      }
      throw new Error("Rendering timed out.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const previewFrame =
    format === "vertical"
      ? "aspect-[9/16] max-h-[calc(100vh-220px)] w-auto"
      : format === "square"
      ? "aspect-square max-h-[calc(100vh-220px)] w-auto"
      : "aspect-video max-h-[calc(100vh-220px)] w-full";

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎬</div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Tricky Online AI Studio</h1>
            <p className="text-sm text-slate-400 leading-tight">
              Photos + Hindi story → cinematic video
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-500 hidden md:block">
          Powered by JSON2Video
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside className="w-full md:w-[46%] lg:w-[42%] xl:w-[38%] max-w-[680px] border-r border-slate-800 bg-slate-900/40 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">

            {/* 1. STORY — sabse upar */}
            <section>
              <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Hindi Narration
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="अपनी कहानी यहां लिखें..."
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-base outline-none focus:border-violet-500 resize-y"
              />
              <p className="text-xs text-slate-500 mt-1">
                Commas/full-stops create natural pauses. Leave empty for silent slideshow.
              </p>
            </section>

            {/* 2. IMAGES — story ke neeche */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Images ({images.length})
                </label>
                {images.length > 0 && (
                  <button
                    onClick={clearImages}
                    disabled={loading}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove All
                  </button>
                )}
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-xl p-6 cursor-pointer bg-slate-950 transition">
                <span className="text-4xl mb-2">📸</span>
                <span className="text-base font-medium">Click to upload images</span>
                <span className="text-sm text-slate-500 mt-1">JPG · PNG · WebP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden"
                      >
                        <div className="relative">
                          <img
                            src={image.preview}
                            alt={`Scene ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <span className="absolute top-1 left-1 bg-black/80 text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => removeImage(image.id)}
                            disabled={loading}
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 rounded-full w-6 h-6 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-between p-1.5">
                          <button
                            onClick={() => moveImage(index, -1)}
                            disabled={loading || index === 0}
                            className="px-2 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30"
                          >←</button>
                          <button
                            onClick={() => moveImage(index, 1)}
                            disabled={loading || index === images.length - 1}
                            className="px-2 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30"
                          >→</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Total: {(estimatedUploadSize / (1024 * 1024)).toFixed(1)} MB · compressed on upload
                  </p>
                </div>
              )}
            </section>

            {/* 3. API Selector */}
            <section>
              <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                JSON2Video API
              </label>

              <select
                value={selectedApiName}
                onChange={(e) => setSelectedApiName(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-base outline-none focus:border-violet-500"
              >
                {(PRESET_APIS || []).map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
                <option value="custom">Use my own API key</option>
              </select>

              {selectedApiName === "custom" && (
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Paste your API key"
                  className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-base outline-none focus:border-violet-500"
                />
              )}

              <p className="text-xs text-amber-400 mt-2">
                ⚠ Local testing only — API key is visible in browser requests.
              </p>
            </section>

            {/* Voice + Format */}
            <div className="grid grid-cols-2 gap-3">
              <section>
                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Voice
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-base"
                >
                  <option value="hi-IN-MadhurNeural">Madhur (Male)</option>
                  <option value="hi-IN-SwaraNeural">Swara (Female)</option>
                </select>
              </section>

              <section>
                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-base"
                >
                  <option value="vertical">9:16 Reels</option>
                  <option value="landscape">16:9 YouTube</option>
                  <option value="square">1:1 Square</option>
                </select>
              </section>
            </div>

            {/* Duration + Transition */}
            <div className="grid grid-cols-2 gap-3">
              <section>
                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Min Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-base"
                >
                  <option value={3}>3s</option>
                  <option value={5}>5s</option>
                  <option value={7}>7s</option>
                  <option value={10}>10s</option>
                </select>
              </section>

              <section>
                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Transition
                </label>
                <select
                  value={transition}
                  onChange={(e) => setTransition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-base"
                >
                  <option value="fade">Fade</option>
                  <option value="dissolve">Dissolve</option>
                  <option value="wipeleft">Wipe Left</option>
                  <option value="slideright">Slide Right</option>
                  <option value="circleopen">Circle Open</option>
                  <option value="none">None</option>
                </select>
              </section>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer">
                <div>
                  <p className="text-base font-medium">Motion</p>
                  <p className="text-xs text-slate-500">Zoom + pan</p>
                </div>
                <input
                  type="checkbox"
                  checked={motion}
                  onChange={(e) => setMotion(e.target.checked)}
                  className="w-5 h-5 accent-violet-500"
                />
              </label>

              <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer">
                <div>
                  <p className="text-base font-medium">Subtitles</p>
                  <p className="text-xs text-slate-500">Hindi auto</p>
                </div>
                <input
                  type="checkbox"
                  checked={subtitles}
                  onChange={(e) => setSubtitles(e.target.checked)}
                  className="w-5 h-5 accent-violet-500"
                />
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur px-5 py-4 space-y-3">
            <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Estimated Duration</p>
                <p className="text-xl font-bold">{formatTime(estimatedDuration)}</p>
              </div>
              <p className={`text-xs ${estimatedDuration > 60 ? "text-red-400" : "text-slate-500"}`}>
                Limit: 60s
              </p>
            </div>

            <button
              onClick={generateVideo}
              disabled={loading || images.length === 0}
              className="w-full py-3.5 rounded-lg font-bold text-base bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition"
            >
              {loading ? "Creating..." : "🎬 Generate Movie"}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col bg-slate-950 p-4 md:p-6">
          <div className="flex-1 flex items-center justify-center min-h-0">
            {videoUrl ? (
              <div className="flex flex-col items-center gap-4 max-h-full">
                <div className={`${previewFrame} overflow-hidden rounded-2xl bg-black border border-slate-700 shadow-2xl`}>
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
                <div className="flex gap-2 w-full max-w-md">
                  <a
                    href={videoUrl}
                    download="my-hindi-movie.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center bg-green-600 hover:bg-green-500 py-3 rounded-lg font-semibold text-base"
                  >
                    ⬇ Download
                  </a>
                  <button
                    onClick={() => { setVideoUrl(""); setStatus(""); }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-semibold text-base"
                  >
                    New Movie
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center px-6">
                <div className="text-7xl mb-4 opacity-30">🎞</div>
                <p className="text-slate-400 text-base max-w-sm">
                  {loading
                    ? status || "Creating your movie..."
                    : "Configure settings on the left and click Generate to preview your movie here."}
                </p>
              </div>
            )}
          </div>

          {loading && (
            <div className="mt-3 space-y-2 shrink-0">
              <div className="flex justify-between text-sm text-slate-400">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status && !loading && !videoUrl && (
            <div className="mt-3 text-center text-sm text-violet-300 shrink-0">
              {status}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}