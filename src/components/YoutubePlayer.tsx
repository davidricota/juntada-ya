import React, { useState, useEffect, useRef } from "react";

const YouTubePlayer = ({ playlistItems, currentVideoIndex, onVideoEnd, onPreviousVideo, onNextVideo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const playerContainerRef = useRef(null);

  // Cargar la API de YouTube
  useEffect(() => {
    // Cargar la API de YouTube solo una vez
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";

      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      // Limpiar el reproductor al desmontar
      if (player) {
        player.destroy();
      }
    };
  }, []);

  // Efectos para manejar cambios en el índice del video actual
  useEffect(() => {
    if (player && playlistItems.length > 0) {
      // Cargar el nuevo video cuando cambia el índice
      const videoId = playlistItems[currentVideoIndex]?.youtube_video_id;
      if (videoId) {
        player.loadVideoById(videoId);
        //  setIsPlaying(true);
      }
    }
  }, [currentVideoIndex, player, playlistItems]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player || !playerContainerRef.current) {
      // Si la API de YouTube no está lista, intentar de nuevo en 100ms
      setTimeout(initializePlayer, 100);
      return;
    }

    if (playlistItems.length === 0) return;

    const newPlayer = new window.YT.Player(playerContainerRef.current, {
      height: "360",
      width: "640",
      videoId: playlistItems[currentVideoIndex]?.youtube_video_id || "",
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          setIsPlaying(true);
        },
        onStateChange: (event) => {
          // Si el video termina, reproducir el siguiente
          if (event.data === window.YT.PlayerState.ENDED) {
            onVideoEnd();
          }

          // Actualizar el estado de reproducción
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        },
        onError: (event) => {
          console.error("Error del reproductor de YouTube:", event.data);
          // Si hay un error, intentar con el siguiente video
          onNextVideo();
        },
      },
    });
  };

  // Manejar reproducción de videos
  const handlePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  if (playlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center p-4 rounded-lg bg-gray-100">
        <p className="text-gray-500">No hay videos en la playlist</p>
      </div>
    );
  }

  const currentVideo = playlistItems[currentVideoIndex];

  return (
    <div className="flex flex-col bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <div className="relative">
        {/* Contenedor del reproductor */}
        <div className="aspect-w-16 aspect-h-9 w-full bg-black">
          <div ref={playerContainerRef} id="youtube-player" className="w-full h-full" />
        </div>

        {/* Controles del reproductor */}
        <div className="bg-gray-800 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold truncate">{currentVideo?.title || "Sin título"}</h3>
            <p className="text-sm text-gray-300">{currentVideo?.channel_title || "Canal desconocido"}</p>
          </div>

          <div className="flex justify-center space-x-4 py-2">
            <button onClick={onPreviousVideo} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Anterior
            </button>

            <button onClick={handlePlayPause} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {isPlaying ? "Pausar" : "Reproducir"}
            </button>

            <button onClick={onNextVideo} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Siguiente
            </button>
          </div>

          <div className="text-sm text-gray-300 text-center mt-2">
            Video {currentVideoIndex + 1} de {playlistItems.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
