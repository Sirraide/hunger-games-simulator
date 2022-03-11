#!/usr/bin/env bash
set -eu

info() {
	echo -e "\033[33m$1\033[m"
}


die() {
	echo -e "\033[31m$1\033[m"
	exit 1
}

time_modified() {
	local time
	time="$(stat -c "%Y" "$1")"
	if ! test $? -eq 0; then die "Could not stat $1"; fi
	echo "$time"
}

rebuild=0
if test "$#" -gt 0 && test "$1" = "--rebuild"; then rebuild=1; fi
if test "$#" -gt 0 && test "$1" = "--clean"; then
	rm ./css/*.css ./*.js ./*.js.map
	exit $?
fi

rebuildp() {
	test $rebuild -eq 1   \
    	|| ! test -f "$2" \
    	||   test "$(time_modified "$1")" -gt "$(time_modified "$2")"
    return $?
}

for i in *.ts js/*.ts; do
	js=${i/.ts/.js}
	if rebuildp "$i" "$js"; then
		info "Compiling \033[32m$i\033[33m..."
		tsc "$i" --pretty -m esnext -t esnext --strictNullChecks --sourceMap
	fi
done

for i in css/*.sass; do
	css=${i/.sass/.css}
	if rebuildp "$i" "$css"; then
		if [[ $(basename "$i") != _* ]]; then
			info "Compiling \033[32m$i\033[33m..."
			sass -c "$i" "$css" > "$css"
		fi
	fi
done