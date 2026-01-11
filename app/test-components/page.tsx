'use client';

import { useState } from 'react';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import Card from '@/components/shared/Card';
import Modal from '@/components/shared/Modal';
import { Search, Plus, Check } from 'lucide-react';

export default function TestComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (inputError) setInputError('');
  };

  const handleValidate = () => {
    if (!inputValue) {
      setInputError('필수 입력 항목입니다');
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          공유 컴포넌트 테스트
        </h1>
        <p className="text-gray-600">
          Button, Input, Card, Modal 컴포넌트를 테스트합니다
        </p>
        <p className="text-sm text-gray-500 mt-2">
          부모/아이 계정으로 로그인하여 테마 색상 변화를 확인하세요
        </p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-800 border-b-2 pb-2">
          Buttons
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">States</h3>
            <div className="flex flex-wrap gap-3">
              <Button loading>Loading...</Button>
              <Button disabled>Disabled</Button>
              <Button icon={<Plus className="w-5 h-5" />}>With Icon</Button>
              <Button
                icon={<Check className="w-5 h-5" />}
                iconPosition="right"
              >
                Icon Right
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Full Width</h3>
            <Button fullWidth variant="primary">Full Width Button</Button>
          </div>
        </div>
      </section>

      {/* Inputs Section */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-800 border-b-2 pb-2">
          Inputs
        </h2>

        <div className="max-w-2xl space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Basic</h3>
            <Input
              label="이름"
              placeholder="이름을 입력하세요"
              fullWidth
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">With Helper Text</h3>
            <Input
              label="비밀번호"
              type="password"
              helperText="8자 이상 영문, 숫자 조합"
              fullWidth
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">With Error</h3>
            <Input
              label="이메일"
              value={inputValue}
              onChange={handleInputChange}
              error={inputError}
              onBlur={handleValidate}
              placeholder="email@example.com"
              fullWidth
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">With Icons</h3>
            <div className="space-y-3">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="검색..."
                fullWidth
              />
              <Input
                label="포인트"
                type="number"
                rightIcon={<span className="text-sm font-semibold">점</span>}
                placeholder="0"
                fullWidth
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Sizes</h3>
            <div className="space-y-3">
              <Input inputSize="sm" placeholder="Small" fullWidth />
              <Input inputSize="md" placeholder="Medium" fullWidth />
              <Input inputSize="lg" placeholder="Large" fullWidth />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Disabled</h3>
            <Input
              disabled
              value="읽기 전용"
              fullWidth
            />
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-800 border-b-2 pb-2">
          Cards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-2">기본 카드</h3>
            <p className="text-gray-600">
              header와 footer 없이 children만 있는 기본 카드입니다.
            </p>
          </Card>

          <Card
            header={<h3 className="text-lg font-semibold">헤더가 있는 카드</h3>}
          >
            <p className="text-gray-600">
              헤더 영역이 border로 구분되어 있습니다.
            </p>
          </Card>

          <Card
            header={<h3 className="text-lg font-semibold">완전한 카드</h3>}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm">취소</Button>
                <Button size="sm">확인</Button>
              </div>
            }
          >
            <p className="text-gray-600">
              헤더, 본문, 푸터가 모두 있는 카드입니다.
            </p>
          </Card>

          <Card
            hoverable
            border
            header={<h3 className="text-lg font-semibold">호버 효과</h3>}
          >
            <p className="text-gray-600">
              마우스를 올리면 그림자와 border 색상이 변합니다.
            </p>
          </Card>

          <Card padding="sm" shadow="sm">
            <p className="text-sm text-gray-600">
              Small padding & shadow
            </p>
          </Card>

          <Card padding="lg" shadow="lg">
            <p className="text-gray-600">
              Large padding & shadow
            </p>
          </Card>
        </div>
      </section>

      {/* Modal Section */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-800 border-b-2 pb-2">
          Modal
        </h2>

        <div className="space-y-4">
          <Button onClick={() => setIsModalOpen(true)}>
            모달 열기
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="모달 제목"
            description="모달 설명 텍스트입니다"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>
                  확인
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                모달 본문 내용입니다. ESC 키나 오버레이 클릭으로 닫을 수 있습니다.
              </p>
              <Input
                label="테스트 입력"
                placeholder="모달 안에서 입력 가능"
                fullWidth
              />
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">모달 기능:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>ESC 키로 닫기</li>
                  <li>오버레이 클릭으로 닫기</li>
                  <li>바디 스크롤 방지</li>
                  <li>애니메이션 효과</li>
                  <li>역할별 헤더 색상</li>
                </ul>
              </div>
            </div>
          </Modal>
        </div>

        <Card className="bg-blue-50">
          <h3 className="font-semibold mb-2">테스트 방법</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>부모 계정(PIN: 1234)으로 로그인 → 파란색 테마 확인</li>
            <li>아이 계정(PIN: 0000 또는 1111)으로 로그인 → 금색 테마 확인</li>
            <li>모든 버튼, 입력 필드, 카드, 모달의 색상이 변경되는지 확인</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
