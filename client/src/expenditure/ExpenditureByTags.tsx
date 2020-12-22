import { Box, List, ListItem, ListItemText } from '@material-ui/core';
import Big from 'big.js';
import { observer } from 'mobx-react';
import React from 'react';

import { Purchase, Tag } from '../data/store';
import { currency, DateRange, numOfBig } from '../util';

export interface ExpenditureByTagsProps {
  purchases: Purchase[];
  dateRange: DateRange;
}

const ExpenditureByTags: React.FC<ExpenditureByTagsProps> = observer(props => {
  const { purchases, dateRange } = props;
  const indexOfTag = new Map<number, number>();
  const result: [Tag | null, Big][] = [];
  let untaggedResult = new Big(0);
  for (const purchase of purchases) {
    if (!dateRange.isIn(purchase.date)) {
      continue;
    }
    if (purchase.tags.length === 0) {
      untaggedResult = untaggedResult.add(purchase.totalPrice);
    }
    for (const tag of purchase.tags) {
      let i = indexOfTag.get(tag.id);
      if (i === undefined) {
        i = result.length;
        indexOfTag.set(tag.id, i);
        result.push([tag, new Big(0)]);
      }
      result[i][1] = result[i][1].add(purchase.totalPrice);
    }
  }
  if (untaggedResult.eq(0)) {
    result.push([null, untaggedResult]);
  }
  result.sort((a, b) => b[1].cmp(a[1]));
  return (
    <List>
      {result.map(([tag, amount]) => (
        <ListItem key={tag?.id ?? -1}>
          <ListItemText>
            <Box display='flex'>
              <Box flexGrow={1}>{tag?.name ?? 'untagged'}</Box>
              <Box>{currency.format(numOfBig(amount))}</Box>
            </Box>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
});

export default ExpenditureByTags;
