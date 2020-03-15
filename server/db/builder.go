package db

import (
	"strconv"
	"strings"
)

type queryBuilder struct {
	query            strings.Builder
	params           []interface{}
	insertValueCount int
}

func updateQuery(table string) *queryBuilder {
	b := &queryBuilder{
		params: []interface{}{},
	}
	b.query.WriteString("UPDATE ")
	b.query.WriteString(table)
	b.query.WriteString(" SET")
	return b
}

func insertQuery(table string, cols ...string) *queryBuilder {
	b := &queryBuilder{
		params: []interface{}{},
	}
	b.query.WriteString("INSERT INTO ")
	b.query.WriteString(table)
	b.query.WriteRune('(')
	for i, col := range cols {
		if i > 0 {
			b.query.WriteRune(',')
		}
		b.query.WriteString(col)
	}
	b.query.WriteString(")VALUES")
	return b
}

func (b *queryBuilder) Values(vals ...interface{}) *queryBuilder {
	if b.insertValueCount > 0 {
		b.query.WriteRune(',')
	}
	b.insertValueCount++
	b.query.WriteRune('(')
	for i, val := range vals {
		if i > 0 {
			b.query.WriteRune(',')
		}
		b.writeParam(val)
	}
	b.query.WriteRune(')')
	return b
}

func (b *queryBuilder) Returning(cols ...string) *queryBuilder {
	b.query.WriteString(" RETURNING ")
	for i, col := range cols {
		if i > 0 {
			b.query.WriteRune(',')
		}
		b.query.WriteString(col)
	}
	return b
}

func (b *queryBuilder) Set(col string, val interface{}) *queryBuilder {
	if len(b.params) == 0 {
		b.query.WriteRune(' ')
	} else {
		b.query.WriteRune(',')
	}
	b.query.WriteString(col)
	b.query.WriteRune('=')
	b.writeParam(val)
	return b
}

func (b *queryBuilder) Where() *queryBuilder {
	b.query.WriteString(" WHERE")
	return b
}

func (b *queryBuilder) Column(col string, val interface{}) *queryBuilder {
	b.query.WriteRune(' ')
	b.query.WriteString(col)
	b.query.WriteRune('=')
	b.writeParam(val)
	return b
}

func (b *queryBuilder) And() *queryBuilder {
	b.query.WriteString(" AND")
	return b
}

func (b *queryBuilder) Build() (string, []interface{}) {
	return b.query.String(), b.params
}

func (b *queryBuilder) HasParams() bool {
	return len(b.params) > 0
}

func (b *queryBuilder) writeParam(p interface{}) {
	b.params = append(b.params, p)
	b.query.WriteRune('$')
	b.query.WriteString(strconv.Itoa(len(b.params)))
}
