import { makeStyles, Theme, createStyles } from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { AutoSizer } from 'react-virtualized';
import { Virtuoso } from 'react-virtuoso';

import { Purchase } from '../data/store';
import PurchaseItem from './PurchaseItem';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    purchaseItem: {
      backgroundColor: theme.palette.background.default,
      transition: theme.transitions.create(['padding-top', 'padding-bottom'], {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expanded: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
    },
  }),
);

export interface PurchaseListProps {
  purchases: Purchase[];
  onEditPurchase: (p: Purchase) => void;
  onDeletePurchase: (p: Purchase) => void;
}

const PurchaseList: React.FC<PurchaseListProps> = observer(props => {
  const { purchases } = props;

  const classes = useStyles();

  const [expandedPurchase, setExpandedPurchase] = useState<Purchase | null>(
    null,
  );

  function renderPurchaseItem(i: number) {
    const p = purchases[i];
    const toggle = () => {
      if (expandedPurchase?.id === p.id) {
        setExpandedPurchase(null);
      } else {
        setExpandedPurchase(p);
      }
    };
    const isExpanded = expandedPurchase?.id === p.id;
    const className = `${classes.purchaseItem} ${
      isExpanded ? classes.expanded : ''
    }`;
    return (
      <div key={p.id} className={className}>
        <PurchaseItem
          purchase={p}
          expanded={isExpanded}
          onToggle={toggle}
          onEdit={props.onEditPurchase}
          onDelete={props.onDeletePurchase}
        />
      </div>
    );
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <Virtuoso
          style={{ width, height }}
          totalCount={purchases.length}
          itemContent={renderPurchaseItem}
        />
      )}
    </AutoSizer>
  );
});

export default PurchaseList;
