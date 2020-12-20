import { List, ListItem, ListItemText } from '@material-ui/core';
import React from 'react';
import Big from 'big.js';
import { History } from 'history';
import { useHistory } from 'react-router-dom';

import { currency, numOfBig } from './util';
import { Purchase } from './data/store';

export interface GroupedExpenditureViewProps {
  purchases: Purchase[];
  splitHere: (prev: Purchase, current: Purchase) => boolean;
  format: (x: moment.Moment) => string;
}

const GroupedExpneditureView: React.FC<GroupedExpenditureViewProps> = props => {
  const { purchases, format } = props;
  if (purchases.length === 0) {
    return <List></List>;
  }
  const history = useHistory();
  const result: JSX.Element[] = [];
  let prev = getLatest(purchases);
  let expenditure = prev.totalPrice;
  for (let i = 1; i < purchases.length; i++) {
    const current = purchases[i];
    if (props.splitHere(prev, current)) {
      expenditure = expenditure.add(current.totalPrice);
    } else {
      result.push(makeItem(i, format(prev.date), expenditure, history));
      expenditure = current.totalPrice;
    }
    prev = current;
  }
  result.push(makeItem(0, format(prev.date), expenditure, history));
  return <List>{result}</List>;
};

function getLatest(purchases: Purchase[]) {
  let latest = purchases[0];
  for (let i = 1; i < purchases.length; i++) {
    if (purchases[i].date.isAfter(latest.date)) {
      latest = purchases[i];
    }
  }
  return latest;
}

function makeItem(
  i: number,
  text: string,
  expenditure: Big,
  history: History,
) {
  return (
    <ListItem
      key={i}
      button
      onClick={() => history.push('/expenditure/' + text)}
    >
      <ListItemText
        primary={text}
        secondary={currency.format(numOfBig(expenditure))} />
    </ListItem>
  );
}

export default GroupedExpneditureView;
