#!/bin/bash
set -e

cd /docker-entrypoint-initdb.d

DB=github_log
LOCKFILE=inited.lock

if test -f "$LOCKFILE"; then
    echo "$LOCKFILE exists."
else
    clickhouse client -q "CREATE DATABASE $DB;" # create database
    clickhouse client -m < /data/table # create table
    echo "Init database done."
    clickhouse client -q "INSERT INTO $DB.events FORMAT Native" < /data/data # insert data
    echo "Insert data done."

    touch $LOCKFILE
fi
