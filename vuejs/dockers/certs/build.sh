#!/bin/bash
#!/bin/bash
domain='app.local'
rm $domain  -Rf
./minica --domains 'app.local'

cat ./$domain/cert.pem ./$domain/key.pem > ./$domain/all.pem
cp ./$domain/* ../etc/nginx/conf.d/certs/ -Rf
