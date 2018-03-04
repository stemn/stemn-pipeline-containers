for i in $(ls -d */);
  do docker build -t stemn/${i%%/} ${i%%/};
done
