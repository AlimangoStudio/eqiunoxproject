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
      const itemClassName = "font-bold text-lg m-1 p-4 w-12 h-14 flex flex-col content-center items-center justify-center bg-gray-700 text-white rounded-md";
      const textClassName = "text-sm"
      return (
        <div className="flex p-0" style={style}>
          <div className={itemClassName}>
            <div>
              {hours < 10 ? `0${hours}` : hours}
            </div>
            <div className={textClassName}>hrs</div>
          </div>
          <div className={itemClassName}>
            <div>
              {minutes < 10 ? `0${minutes}` : minutes}
            </div>
            <div className={textClassName}>mins</div>
          </div>
          <div className={itemClassName}>
          <div>
              {seconds < 10 ? `0${seconds}` : seconds}
            </div>
            <div className={textClassName}>secs</div>
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
