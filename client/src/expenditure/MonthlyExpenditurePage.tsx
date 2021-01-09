import { Paper } from '@material-ui/core';
import GroupedExpneditureView from 'expenditure/GroupedExpenditureView';
import moment from 'moment';
import React from 'react';

import { getDataState, useAppSelector, useData } from '../data/store';
import CenteredLoader from '../common/CenteredLoader';
import Scaffold from '../common/Scaffold';
import { getPurchases, Purchase } from '../data/purchases';

const MonthlyExpenditurePage: React.FC = () => {
  useData();
  const dataState = useAppSelector(getDataState);
  const purchases = useAppSelector(getPurchases);
  return (
    <Scaffold
      title='Monthly Expenditure'
      content={
        <Paper>
          {dataState !== 'finished' ? (
            <CenteredLoader />
          ) : (
            <GroupedExpneditureView
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
  return current.date.isSame(prev.date, 'month');
}

function formatFunc(x: moment.Moment) {
  return x.format('M/YYYY');
}

export default MonthlyExpenditurePage;
