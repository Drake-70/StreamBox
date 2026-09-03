import React, { useEffect, useRef } from "react";

// A YouTube player that resumes a saved playhead and periodically reports the
// current position so the backend can persist "Continue Watching" progress.
function ResumePlayer({ youtubeVideoId, initialProgress, onProgressSave }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const savedProgressRef = useRef(initialProgress || 0);

  useEffect(() => {
    let cancelled = false;
    const videoId = youtubeVideoId;

    function onYouTubeIframeAPIReady() {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          start: Math.floor(savedProgressRef.current || 0),
        },
        events: {
          onReady: (event) => {
            try {
              const start = Math.floor(savedProgressRef.current || 0);
              if (start > 0 && event.target.getDuration() > start) {
                event.target.seekTo(start, true);
              }
            } catch (error) {
              /* ignore */
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              const start = Math.floor(savedProgressRef.current || 0);
              try {
                if (start > 0 && event.target.getCurrentTime() < 1) {
                  event.target.seekTo(start, true);
                }
              } catch (error) {
                /* ignore */
              }
            }
          },
        },
      });
    }

    function loadIframeApi() {
      if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
        return;
      }
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      if (document.getElementById("yt-iframe-api")) return;
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    loadIframeApi();

    const timer = setInterval(() => {
      const p = playerRef.current;
      if (!p || !p.getCurrentTime) return;
      try {
        const cur = Math.floor(p.getCurrentTime() || 0);
        const dur = Math.floor(p.getDuration() || 0);
        if (cur > 0) {
          savedProgressRef.current = cur;
          if (onProgressSave) onProgressSave(cur, dur);
        }
      } catch (error) {
        /* ignore */
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      try {
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      } catch (error) {
        /* ignore */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

  return <div ref={hostRef} className="resume-player-host" />;
}

export default ResumePlayer;
