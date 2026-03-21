#!/bin/bash
# ============================================================
# 아침 브리핑 자동 실행 설정 스크립트 (macOS LaunchAgent)
# 실행: bash scripts/setup.sh
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_NAME="com.user.morning-brief"
PLIST_TEMPLATE="$PROJECT_DIR/launchagent/$PLIST_NAME.plist"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_DIR/$PLIST_NAME.plist"
LOG_DIR="$PROJECT_DIR/logs"

echo ""
echo "🌅 아침 경제 브리핑 — macOS 자동 실행 설정"
echo "============================================"

# node 경로 찾기
NODE_PATH=$(which node 2>/dev/null || echo "")
if [ -z "$NODE_PATH" ]; then
    echo "❌ node를 찾을 수 없습니다. Node.js를 먼저 설치하세요."
    exit 1
fi
echo "✅ Node.js: $NODE_PATH ($(node --version))"

# tsx 경로 확인
TSX_PATH="$PROJECT_DIR/node_modules/.bin/tsx"
if [ ! -f "$TSX_PATH" ]; then
    echo "❌ tsx를 찾을 수 없습니다. npm install을 실행하세요."
    exit 1
fi
echo "✅ tsx: $TSX_PATH"

# logs 폴더 생성
mkdir -p "$LOG_DIR"
echo "✅ 로그 폴더: $LOG_DIR"

# LaunchAgents 폴더 생성
mkdir -p "$LAUNCH_DIR"

# plist 파일 생성 (플레이스홀더 교체)
sed \
    -e "s|NODE_PATH_PLACEHOLDER|$NODE_PATH|g" \
    -e "s|PROJECT_PATH_PLACEHOLDER|$PROJECT_DIR|g" \
    "$PLIST_TEMPLATE" > "$PLIST_DEST"

# tsx 경로를 ProgramArguments에서 직접 import 대신 실제 tsx 바이너리 방식으로 교체
# Node의 --import tsx/esm 대신 tsx 바이너리를 직접 쓰는 방식으로 재생성
cat > "$PLIST_DEST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>

    <key>ProgramArguments</key>
    <array>
        <string>$TSX_PATH</string>
        <string>$PROJECT_DIR/scripts/morning-brief.ts</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>

    <key>StandardOutPath</key>
    <string>$LOG_DIR/morning-brief.log</string>

    <key>StandardErrorPath</key>
    <string>$LOG_DIR/morning-brief-error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$(dirname "$NODE_PATH")</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ LaunchAgent plist 생성: $PLIST_DEST"

# 기존 LaunchAgent 언로드 (있을 경우)
launchctl unload "$PLIST_DEST" 2>/dev/null && echo "   (기존 LaunchAgent 언로드)" || true

# LaunchAgent 등록
launchctl load "$PLIST_DEST"
echo "✅ LaunchAgent 등록 완료"

# .env.local 확인
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    echo ""
    echo "⚠️  .env.local 파일이 없습니다!"
    echo "   .env.local.example을 복사하고 API 키를 입력하세요:"
    echo "   cp .env.local.example .env.local"
else
    echo "✅ .env.local 존재 확인"
fi

echo ""
echo "🎉 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. cp .env.local.example .env.local  (아직 안 했다면)"
echo "   2. .env.local에 ANTHROPIC_API_KEY 입력"
echo "   3. Telegram 알림 원하면 BOT_TOKEN + CHAT_ID 입력"
echo ""
echo "🧪 지금 바로 테스트:"
echo "   npm run brief"
echo ""
echo "📅 매일 오전 8시에 자동 실행됩니다."
echo "   로그 확인: tail -f logs/morning-brief.log"
echo ""
