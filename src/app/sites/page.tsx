"use client";

import Link from "next/link";
import { sampleSites } from "@/lib/data/sites";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import {
  getBuildingTypeIcon,
  getBuildingTypeLabel,
  getProgressPercentage,
  getStatusLabel,
  getStatusColor,
  formatDateFull,
} from "@/lib/utils";

export default function SitesPage() {
  return (
    <div>
      <PageHeader
        title="現場一覧"
        description="管理中のすべての塗装工事現場"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {sampleSites.map((site) => {
          const progress = getProgressPercentage(site.processes);
          return (
            <Link href={`/sites/${site.id}`} key={site.id}>
              <Card className="group hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-5 sm:p-7">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl sm:text-5xl">
                        {getBuildingTypeIcon(site.buildingType)}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {site.name}
                        </h3>
                        <p className="text-base text-gray-500 mt-0.5">
                          {site.address}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(site.status)} text-sm px-3 py-1`}
                      variant="secondary"
                    >
                      {getStatusLabel(site.status)}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-400">施主</p>
                      <p className="text-base font-semibold text-gray-900">
                        {site.ownerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">建物種別</p>
                      <p className="text-base font-semibold text-gray-900">
                        {getBuildingTypeLabel(site.buildingType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">塗装面積</p>
                      <p className="text-base font-semibold text-gray-900">
                        {site.paintArea}m²
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">開始予定</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDateFull(site.startDate)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-gray-500">工事進捗</span>
                      <span className="text-2xl font-extrabold text-blue-700">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  {/* CTA */}
                  <div className="mt-5 text-center text-base font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    詳細を見る →
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
