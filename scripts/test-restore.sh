#!/usr/bin/env bash
# Uses only the MariaDB service created by the GitHub Actions job.
set -euo pipefail
: "${MARIADB_CONTAINER:?CI MariaDB container required}"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT
db() {
  docker exec -i "$MARIADB_CONTAINER" sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" exec "$@"' sh "$@"
}
mkdir "$temp_dir/uploads" "$temp_dir/restored-uploads"
printf 'CI upload restoration fixture\n' > "$temp_dir/uploads/00000000-0000-4000-8000-000000000001.png"
db mariadb -h127.0.0.1 -uroot marmiton_test -e "UPDATE Recipe SET imagePath='/media/00000000-0000-4000-8000-000000000001.png' WHERE id='00000000-0000-4000-8000-000000000001'"
db mariadb-dump -h127.0.0.1 -uroot --single-transaction marmiton_test > "$temp_dir/database.sql"
tar -C "$temp_dir/uploads" -czf "$temp_dir/uploads.tar.gz" .
db mariadb -h127.0.0.1 -uroot -e 'CREATE DATABASE marmiton_restore_ci CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
db mariadb -h127.0.0.1 -uroot marmiton_restore_ci < "$temp_dir/database.sql"
tar -C "$temp_dir/restored-uploads" -xzf "$temp_dir/uploads.tar.gz"
field="$(db mariadb -h127.0.0.1 -uroot --batch --skip-column-names marmiton_restore_ci -e "SELECT imagePath FROM Recipe WHERE id='00000000-0000-4000-8000-000000000001'")"
test "$field" = /media/00000000-0000-4000-8000-000000000001.png
cmp "$temp_dir/uploads/${field##*/}" "$temp_dir/restored-uploads/${field##*/}"
test "$(db mariadb -h127.0.0.1 -uroot --batch --skip-column-names marmiton_restore_ci -e 'SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL')" -ge 3
echo 'MariaDB migrations, recipe and referenced upload restored successfully.'
