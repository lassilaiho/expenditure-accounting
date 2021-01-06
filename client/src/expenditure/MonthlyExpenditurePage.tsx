import { Paper } from '@material-ui/core';
import GroupedExpneditureView from 'expenditure/GroupedExpenditureView';
import moment from 'moment';
import React from 'react';

import {
  getDataState,
  getPurchases,
  Purchase,
  useAppSelector,
} from '../data/store';
import CenteredLoader from '../common/CenteredLoader';
import MenuButton from '../common/MenuButton';
import Scaffold from '../common/Scaffold';

export interface MonthlyExpenditurePageProps {
  openNavigation: () => void;
}

const MonthlyExpenditurePage: React.FC<MonthlyExpenditurePageProps> = props => {
  const dataState = useAppSelector(getDataState);
  const purchases = useAppSelector(getPurchases);
  return (
    <Scaffold
      nav={<MenuButton onClick={props.openNavigation} />}
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
