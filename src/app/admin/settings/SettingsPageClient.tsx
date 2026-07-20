'use client';

import { type ReactNode, useState } from 'react';
import { PageHeader } from '@/components/app/ui-bits';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Shield, Bell, Upload, MapPin, Award, Ticket, Globe } from 'lucide-react';

export default function SettingsPageClient() {
  const [tab, setTab] = useState('gps');
  const tabs = [
    { k: 'gps', l: 'GPS', icon: MapPin },
    { k: 'upload', l: 'Tải lên', icon: Upload },
    { k: 'moderation', l: 'Tự kiểm duyệt', icon: Shield },
    { k: 'notify', l: 'Thông báo', icon: Bell },
    { k: 'xp', l: 'Công thức XP', icon: Award },
    { k: 'voucher', l: 'Voucher', icon: Ticket },
    { k: 'lang', l: 'Ngôn ngữ', icon: Globe },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình toàn bộ logic vận hành (BR-01, BR-38, BR-65, BR-67)."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="w-4 h-4" />Khôi phục mặc định
            </Button>
            <Button size="sm" className="gap-1.5">
              <Save className="w-4 h-4" />Lưu thay đổi
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 card-elev rounded-2xl p-2 h-fit space-y-2">
          {tabs.map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`w-full flex items-center justify-start gap-2 whitespace-nowrap px-3 py-2 rounded-lg border text-sm ${
                tab === t.k
                  ? 'border-primary bg-primary-soft text-foreground'
                  : 'border-border text-muted-foreground hover:bg-surface-2'
              }`}
            >
              <t.icon className={`w-4 h-4 ${tab === t.k ? 'text-primary' : ''}`} />
              <span className="overflow-hidden text-ellipsis">{t.l}</span>
            </button>
          ))}
        </aside>

        <section className="md:col-span-3 space-y-4">
          {tab === 'gps' && (
            <Card title="Cài đặt GPS check-in">
              <Row label="Bán kính check-in" hint="Khoảng cách tối đa từ vị trí thật tới hotspot.">
                <div className="flex items-center gap-3">
                  <input type="range" min={10} max={200} defaultValue={50} className="flex-1 accent-[color:var(--primary)]" />
                  <span className="text-sm font-mono w-14 text-right">50m</span>
                </div>
              </Row>
              <Row label="Bắt buộc GPS thật">
                <Toggle defaultChecked />
              </Row>
              <Row label="Cho phép check-in tại Củ Chi (xa trung tâm)">
                <Toggle />
              </Row>
            </Card>
          )}

          {tab === 'upload' && (
            <Card title="Giới hạn tải lên">
              <Row label="Kích thước ảnh tối đa">
                <Input value="5 MB" />
              </Row>
              <Row label="Kích thước video tối đa">
                <Input value="50 MB" />
              </Row>
              <Row label="Số ảnh tối đa / hotspot">
                <Input value="10" />
              </Row>
              <Row label="Định dạng chấp nhận">
                <Input value="JPG, PNG, WEBP, MP4" />
              </Row>
            </Card>
          )}

          {tab === 'moderation' && (
            <Card title="Tự động kiểm duyệt">
              <Row label="Bật bộ lọc từ ngữ thô tục">
                <Toggle defaultChecked />
              </Row>
              <Row label="Tự ẩn nội dung bị báo cáo ≥ 3 lần">
                <Toggle defaultChecked />
              </Row>
              <Row label="Kiểm tra hình ảnh AI (nội dung nhạy cảm)">
                <Toggle />
              </Row>
            </Card>
          )}

          {tab === 'notify' && (
            <Card title="Cấu hình thông báo">
              <Row label="Email khi có nội dung chờ duyệt">
                <Toggle defaultChecked />
              </Row>
              <Row label="Push notification check-in mới">
                <Toggle />
              </Row>
              <Row label="Báo cáo tuần qua email">
                <Toggle defaultChecked />
              </Row>
            </Card>
          )}

          {tab === 'xp' && (
            <Card title="Công thức tính XP">
              <Row label="XP cơ bản mỗi check-in">
                <Input value="50" />
              </Row>
              <Row label="Bội số khi hoàn thành tuyến">
                <Input value="x 1.5" />
              </Row>
              <Row label="Bonus theo độ khó (Khó)">
                <Input value="+100" />
              </Row>
            </Card>
          )}

          {tab === 'voucher' && (
            <Card title="Voucher & phần thưởng">
              <Row label="Bật hệ thống voucher">
                <Toggle defaultChecked />
              </Row>
              <Row label="Hoa hồng đối tác (%)">
                <Input value="12%" />
              </Row>
            </Card>
          )}

          {tab === 'lang' && (
            <Card title="Ngôn ngữ">
              <Row label="Ngôn ngữ mặc định">
                <select className="inp">
                  <option>Tiếng Việt</option>
                  <option>English</option>
                </select>
              </Row>
              <Row label="Cho phép người dùng đổi ngôn ngữ">
                <Toggle defaultChecked />
              </Row>
            </Card>
          )}

          <div className="text-[11px] text-muted-foreground">Mọi thay đổi sẽ được ghi log audit (BR-71).</div>
        </section>
      </div>

      <style>{`.inp{width:100%;height:36px;padding:0 12px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);font-size:13px;outline:none;}`}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-elev rounded-2xl p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <div className="md:w-1/2">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="md:flex-1">{children}</div>
    </div>
  );
}

function Input({ value }: { value: string }) {
  return <input defaultValue={value} className="inp" />;
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full relative transition ${on ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}
