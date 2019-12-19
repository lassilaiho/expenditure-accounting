import {
  Chip,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography,
  Box
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';

import { Purchase } from './purchases';
import { currency, formatDate, threeDecimals } from './util';

export interface PurchaseListItemProps {
  purchase: Purchase;
  expanded: boolean;
  onToggle: () => void;
}

const PurchaseItem: React.FC<PurchaseListItemProps> = props => {
  const { purchase: p, expanded, onToggle } = props;
  let quantity = '';
  if (p.quantity !== 1) {
    if (Number.isInteger(p.quantity)) {
      quantity = `${p.quantity.toFixed(0)} × `;
    } else {
      quantity = `${threeDecimals.format(p.quantity)} × `;
    }
  }
  return (
    <ExpansionPanel
      expanded={expanded}
      onClick={onToggle}
      TransitionProps={{ unmountOnExit: true }}
    >
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography>{quantity + p.product.name}</Typography>
          <Typography color='textSecondary'>
            {`${formatDate(p.date)} • ${currency.format(p.totalPrice)}`}
          </Typography>
        </Box>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Box display='flex' flexWrap='wrap'>
          {p.product.tags.map(t => (
            <Box mr={1}>
              <Chip key={t.id} label={t.name} />
            </Box>
          ))}
        </Box>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};

export default PurchaseItem;
