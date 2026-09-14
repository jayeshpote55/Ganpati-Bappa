import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTimes, FaMusic, FaFilePdf, FaCopy, FaVolumeUp, FaVolumeMute, FaBookOpen } from "react-icons/fa";

export default function AartiReaderModal({ aarti, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Stop speech synthesis when modal closes
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!aarti) return null;

  const copyLyrics = () => {
    if (!aarti.lyrics) {
      toast.error("आरतीचे शब्द उपलब्ध नाहीत.");
      return;
    }
    navigator.clipboard.writeText(`${aarti.title}\n\n${aarti.lyrics}`);
    toast.success("आरतीचे शब्द कॉपी झाले! 📋");
  };

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("तुमच्या ब्राऊझरमध्ये Voice feature उपलब्ध नाही.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!aarti.lyrics) {
      toast.error("वाचनासाठी आरतीचे शब्द उपलब्ध नाहीत.");
      return;
    }

    const textToSpeak = `${aarti.title}. ${aarti.lyrics}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "mr-IN"; // Marathi or Hindi
    utterance.rate = 0.9; // Slightly slower for clear chanting

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    toast.success("आरती वाचन सुरू झाले 🔊");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-2 border-orange-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🌺
            </span>
            <div>
              <h3 className="font-bold text-lg sm:text-xl font-display leading-tight">{aarti.title}</h3>
              <p className="text-xs text-orange-100 flex items-center gap-1 mt-0.5">
                <FaBookOpen className="text-[10px]" /> श्री गणेश आरती वाचन
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Audio / PDF Player Section (If available) */}
        {(aarti.audioUrl || aarti.pdfUrl) && (
          <div className="bg-orange-100/70 border-b border-orange-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            {aarti.audioUrl && (
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                  <FaMusic /> आरती ऑडिओ ऐका:
                </p>
                <audio controls src={aarti.audioUrl} className="w-full h-8" />
              </div>
            )}

            {aarti.pdfUrl && (
              <a
                href={aarti.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <FaFilePdf /> PDF पाहा / डाउनलोड करा
              </a>
            )}
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="bg-orange-50 border-b border-orange-100 px-6 py-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-500 font-medium">संपूर्ण आरती:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeech}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                isSpeaking
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-orange-200 hover:bg-orange-300 text-orange-900"
              }`}
            >
              {isSpeaking ? <FaVolumeMute /> : <FaVolumeUp />}
              {isSpeaking ? "वाचन थांबवा" : "आरती ऐका (Voice)"}
            </button>

            <button
              onClick={copyLyrics}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition"
            >
              <FaCopy className="text-orange-500" /> कॉपी करा
            </button>
          </div>
        </div>

        {/* Formatted Marathi Lyrics Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-orange-50/50 to-white">
          {aarti.lyrics ? (
            <div className="bg-orange-50/80 rounded-2xl p-6 border border-orange-200 shadow-inner">
              <div className="text-center font-display text-lg sm:text-xl leading-relaxed text-maroon-800 font-semibold whitespace-pre-line tracking-wide">
                {aarti.lyrics}
              </div>
              <div className="text-center mt-6 text-orange-600 font-bold text-base font-display">
                🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🚩
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p className="text-lg">या आरतीचे शब्द उपलब्ध नाहीत.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
