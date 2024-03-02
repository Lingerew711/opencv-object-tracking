import { Button } from '@nextui-org/react'
import React, { MutableRefObject } from 'react'
import { TfiControlPause, TfiControlPlay } from 'react-icons/tfi'

interface Props{

    isPlaying: boolean;
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    vidCurrentTime: number;
    handleSeekChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Controls = ({ isPlaying, handleSeekChange, vidCurrentTime, videoRef } : Props) => {
  return (
    <div className="flex justify-center gap-8 p-4 md:p-6">
    {isPlaying ?
      <Button variant="light" onClick={() => videoRef.current?.pause()}><TfiControlPause className="w-4 h-4 md:w-6 md:h-6" /></Button>
      :
      <Button variant="light" onClick={() => videoRef.current?.play()}><TfiControlPlay className="w-4 h-4 md:w-6 md:h-6" /></Button>
    }
    <input className="w-full" type="range" min="0" max={videoRef.current?.duration || 0} value={vidCurrentTime} onChange={handleSeekChange} />
  </div>
  )
}

export default Controls