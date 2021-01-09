import { Paper } from '@material-ui/core';
import moment from 'moment';
import React from 'react';

import { getDataState, useAppSelector, useData } from '../data/store';
import CenteredLoader from '../common/CenteredLoader';
import Scaffold from '../common/Scaffold';
import { getPurchases, Purchase } from '../data/purchases';
import GroupedExpenditureView from './GroupedExpenditureView';

const DailyExpenditurePage: React.FC = () => {
  useData();
  const dataState = useAppSelector(getDataState);
  const purchases = useAppSelector(getPurchases);
  return (
    <Scaffold
      title='Daily Expenditure'
      content={
        <Paper>
          {dataState !== 'finished' ? (
            <CenteredLoader />
          ) : (
            <GroupedExpenditureView
              purchases={purchases}
              splitHere={splitFunc}
              format={formatFunc}
            />
          )}
        </Paper>
      }
    />
  );
};
function splitFunc(prev: Purchase, current: Purchase) {
  return current.date.isSame(prev.date, 'day');
}

function formatFunc(x: moment.Moment) {
  return x.clone().local().format('D.M.YYYY');
}

export default DailyExpenditurePage;
