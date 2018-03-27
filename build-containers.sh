for i in $(ls -d */);
  do docker build -t stemn/${i%%/}:latest ${i%%/};
done
