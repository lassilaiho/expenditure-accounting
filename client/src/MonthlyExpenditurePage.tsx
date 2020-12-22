import { Paper } from '@material-ui/core';
import GroupedExpneditureView from 'GroupedExpenditureView';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';

import { Purchase, useStore } from './data/store';
import CenteredLoader from './CenteredLoader';
import MenuButton from './MenuButton';
import Scaffold from './Scaffold';

export interface MonthlyExpenditurePageProps {
  openNavigation: () => void;
}

const MonthlyExpenditurePage: React.FC<MonthlyExpenditurePageProps> = observer(
  props => {
    const store = useStore();
    return (
      <Scaffold
        nav={<MenuButton onClick={props.openNavigation} />}
        title='Monthly Expenditure'
        content={
          <Paper>
            {store.dataState === 'loading' ? (
              <CenteredLoader />
            ) : (
              <GroupedExpneditureView
                purchases={store.purchases}
                splitHere={splitFunc}
                format={formatFunc}
              />
            )}
          </Paper>
        }
      />
    );
  },
);

function splitFunc(prev: Purchase, current: Purchase) {
  return current.date.isSame(prev.date, 'month');
}

function formatFunc(x: moment.Moment) {
  return x.format('M/YYYY');
}

export default MonthlyExpenditurePage;
