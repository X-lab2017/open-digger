#!/bin/bash
set -e

sql_file=$1
tag=$2
data_path="./data/$tag"
need_to_export=1

QUERY_REMOTE="clickhouse client -h $CH_SERVER --port $CH_PORT -u $CH_USER --password $CH_PASSWORD"

if [ ! -s $sql_file ]; then
    echo "$sql_file file not exist or empty"
    exit -1
fi

# setup data folder
if [ -d $data_path ]; then
    echo "Data folder already exists, do you want to remove and download?(Y)"
    read input
    if [ "$input" = "Y" ]; then
        echo "Gonna remove data folder."
        rm -rf $data_path
    else
        need_to_export=0
    fi
fi
if [ ! -d $data_path ]; then
    echo "Create data folder."
    mkdir -p $data_path
fi

# export data
if [ "$need_to_export" -eq 1 ]; then
    # export table schema
    echo "Start to export table schema"
    $QUERY_REMOTE -q "SHOW CREATE TABLE opensource.events INTO OUTFILE '$data_path/table' FORMAT TabSeparatedRaw;"
    echo "Table schema exported"

    # export data
    echo "Start to export data"
    export_sql="$(cat $sql_file) INTO OUTFILE '$data_path/data' FORMAT Native;"
    $QUERY_REMOTE -q "$export_sql"
    echo "Export data done."
else
    echo "Skip data export."
fi

cd $data_path

if [ ! -s 'data.tar.gz' ]; then
    # compress data
    echo "Start to compress data"
    tar zcf data.tar.gz data table
    echo "Compress data done"
fi

# upload to oss
echo "Goona upload to OSS."
ossutil cp data.tar.gz oss://open-digger-oss/sample_data/$tag.tar.gz --config-file=~/.ossutilconfig-open-digger -f

echo "Process done."
