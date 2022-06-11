#!/bin/bash
set -e

cd /docker-entrypoint-initdb.d

DB=github_log
LOCKFILE=inited.lock

# check lock file
if test -f "$LOCKFILE"; then
    echo "$LOCKFILE exists."
else
    # check data files
    if [ ! -s '/data/table' -o ! -s '/data/data' ]; then
        echo "Data or table file not exists under /data folder"
        exit -1
    fi

    # drop the database first in case partial initialization
    clickhouse client -q "DROP DATABASE IF EXISTS $DB;"
    # create database
    clickhouse client -q "CREATE DATABASE $DB;"
    # create table
    clickhouse client -m < /data/table
    echo "Init database done."
    # insert data
    clickhouse client -q "INSERT INTO $DB.events FORMAT Native" < /data/data
    echo "Insert data done."

    # create lock file
    touch $LOCKFILE
fi
