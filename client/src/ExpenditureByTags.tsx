import { Box, List, ListItem, ListItemText } from '@material-ui/core';
import { observer } from 'mobx-react';
import React from 'react';

import { Purchase } from './purchases';
import { Tag } from './tags';
import { currency, DateRange } from './util';

export interface ExpenditureByTagsProps {
  purchases: Purchase[];
  dateRange: DateRange;
}

const ExpenditureByTags: React.FC<ExpenditureByTagsProps> = observer(props => {
  const { purchases, dateRange } = props;
  const indexOfTag = new Map<number, number>();
  const result: [Tag, number][] = [];
  for (const purchase of purchases) {
    if (!dateRange.isIn(purchase.date)) {
      continue;
    }
    for (const tag of purchase.product.tags) {
      let i = indexOfTag.get(tag.id);
      if (i === undefined) {
        i = result.length;
        indexOfTag.set(tag.id, i);
        result.push([tag, 0]);
      }
      result[i][1] += purchase.totalPrice;
    }
  }
  result.sort((a, b) => b[1] - a[1]);
  return (
    <List>
      {result.map(([tag, amount]) => (
        <ListItem key={tag.id}>
          <ListItemText>
            <Box display='flex'>
              <Box flexGrow={1}>{tag.name}</Box>
              <Box>{currency.format(amount)}</Box>
            </Box>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
});

export default ExpenditureByTags;
