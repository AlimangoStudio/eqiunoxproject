import Countdown from 'react-countdown';
import React from 'react';

interface MintCountdownProps {
  date: Date | undefined;
  style?: React.CSSProperties;
  status?: string;
  onComplete?: () => void;
}

interface MintCountdownRender {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

export const MintCountdown: React.FC<MintCountdownProps> = ({
  date,
  status,
  style,
  onComplete,
}) => {
  const renderCountdown = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: MintCountdownRender) => {
    hours += days * 24;
    if (completed) {
      return status ? <span className="flex mb-1 h-7 p-2 flex-col items-center content-center justify-center bg-gray-700 text-white rounded-md font-bold text-lg">{status}</span> : null;
    } else {
      const itemClassName = "font-bold text-lg m-1 w-12 h-12 flex flex-col content-center items-center justify-center bg-gray-700 text-white rounded-md";

      return (
        <div className="flex p-0" style={style}>
          <div className={itemClassName}>
            <span>
              {hours < 10 ? `0${hours}` : hours}
            </span>
            <span className=''>hrs</span>
          </div>
          <div className={itemClassName}>
            <span>
              {minutes < 10 ? `0${minutes}` : minutes}
            </span>
            <span>mins</span>
          </div>
          <div className={itemClassName}>
          <span>
              {seconds < 10 ? `0${seconds}` : seconds}
            </span>
            <span>secs</span>
          </div>
        </div>
      );
    }
  };

  if (date) {
    return (
      <Countdown
        date={date}
        onComplete={onComplete}
        renderer={renderCountdown}
      />
    );
  } else {
    return null;
  }
};
