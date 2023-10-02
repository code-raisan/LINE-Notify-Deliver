# LINE Notify Deliver

OAuth認証で認証したユーザーにメッセージを一斉送信します。

## Use case

自分の使用用途は個人情報の鎌足なので言えませんが、考えられる事例だけ置いておきます。

ブログ等の更新をLINEで購読するシステム（メールマガジン的な）

LINE Official Accountは一斉送信にも制限があるので、これであれば無制限に配信できます。

## Use

`docker-compose.yml` とかにイイ感じに環境変数を設定

`docker-compose.yml` を起動。ポート 4000にアクセス。

`/secure` 以降はCloudflare Access等で保護してください。

`/` にユーザーをアクセスさせることで連携させることが出来ます

`/secure/api/notify` に通常LINE Notifyと同じようにリクエストを送ることで送信できます（ただしContent-Typeは`application/json`を使用）

`/secure/dashboard` で気持ちばかりのダッシュボードにアクセスできます。
