import Countdown from 'react-countdown';
import React from 'react';
import { createStyles, Paper, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      padding: '0px',
      '& > *': {
        margin: '3.2px',
        width: '48px',
        height: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#384457',
        color: 'white',
        borderRadius: 5,
        fontSize: 10,
      },
    },
  })
);

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
  const classes = useStyles();
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
      const itemClassName = "font-bold text-lg";
      const root = "flex p-0";

      return (
        <div className={classes.root} style={style}>
          <div className={itemClassName}>
            <span>
              {hours < 10 ? `0${hours}` : hours}
            </span>
            <span>hrs</span>
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
