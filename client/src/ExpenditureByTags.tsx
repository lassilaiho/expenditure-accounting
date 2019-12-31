import { Box, List, ListItem, ListItemText } from '@material-ui/core';
import { observer } from 'mobx-react';
import React from 'react';

import { Purchase, Tag } from './data/store';
import { currency, DateRange } from './util';

export interface ExpenditureByTagsProps {
  purchases: Purchase[];
  dateRange: DateRange;
}

const ExpenditureByTags: React.FC<ExpenditureByTagsProps> = observer(props => {
  const { purchases, dateRange } = props;
  const indexOfTag = new Map<number, number>();
  const result: [Tag | null, number][] = [];
  let untaggedResult = 0;
  for (const purchase of purchases) {
    if (!dateRange.isIn(purchase.date)) {
      continue;
    }
    if (purchase.tags.length === 0) {
      untaggedResult += purchase.totalPrice;
    }
    for (const tag of purchase.tags) {
      let i = indexOfTag.get(tag.id);
      if (i === undefined) {
        i = result.length;
        indexOfTag.set(tag.id, i);
        result.push([tag, 0]);
      }
      result[i][1] += purchase.totalPrice;
    }
  }
  if (untaggedResult !== 0) {
    result.push([null, untaggedResult]);
  }
  result.sort((a, b) => b[1] - a[1]);
  return (
    <List>
      {result.map(([tag, amount]) => (
        <ListItem key={tag?.id ?? -1}>
          <ListItemText>
            <Box display='flex'>
              <Box flexGrow={1}>{tag?.name ?? 'untagged'}</Box>
              <Box>{currency.format(amount)}</Box>
            </Box>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
});

export default ExpenditureByTags;
