import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, Rect, G, Text as SvgText } from "react-native-svg";

const COLORS = {
  primary: "#1B4332",
  secondary: "#40916C",
  accent: "#D4A574",
  gold: "#C9A227",
  success: "#2D6A4F",
  warning: "#E9C46A",
  danger: "#E63946",
  info: "#457B9D",
  gray: "#6C757D",
  lightGray: "#E9ECEF",
  white: "#FFFFFF",
  text: "#212529",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LineChartProps {
  data: number[];
  labels: string[];
  title?: string;
  color?: string;
  height?: number;
  showDots?: boolean;
  suffix?: string;
}

export function LineChart({
  data,
  labels,
  title,
  color = COLORS.primary,
  height = 180,
  showDots = true,
  suffix = "",
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.noDataText}>Sem dados para exibir</Text>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = height - 60;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const maxValue = Math.max(...data) * 1.1 || 1;
  const minValue = Math.min(...data) * 0.9 || 0;
  const range = maxValue - minValue || 1;

  const getX = (index: number) =>
    padding.left + (index / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);

  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  // Create path
  let pathD = "";
  data.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);
    if (index === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Create area path
  let areaD = pathD;
  areaD += ` L ${getX(data.length - 1)} ${padding.top + chartHeight}`;
  areaD += ` L ${getX(0)} ${padding.top + chartHeight}`;
  areaD += " Z";

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={chartWidth - padding.right}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke={COLORS.lightGray}
            strokeWidth={1}
          />
        ))}

        {/* Area fill */}
        <Path d={areaD} fill={color + "20"} />

        {/* Line */}
        <Path d={pathD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {showDots &&
          data.map((value, index) => (
            <Circle
              key={index}
              cx={getX(index)}
              cy={getY(value)}
              r={5}
              fill={COLORS.white}
              stroke={color}
              strokeWidth={2}
            />
          ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, i) => {
          const value = minValue + range * ratio;
          return (
            <SvgText
              key={i}
              x={padding.left - 8}
              y={padding.top + chartHeight * (1 - ratio) + 4}
              fontSize={10}
              fill={COLORS.gray}
              textAnchor="end"
            >
              {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
              {suffix}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, index) => (
          <SvgText
            key={index}
            x={getX(index)}
            y={height - 8}
            fontSize={10}
            fill={COLORS.gray}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  horizontal?: boolean;
}

export function BarChart({ data, title, height = 200, horizontal = false }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.noDataText}>Sem dados para exibir</Text>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = height - 60;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const maxValue = Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const barWidth = (chartWidth - padding.left - padding.right) / data.length - 10;

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={chartWidth - padding.right}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke={COLORS.lightGray}
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding.left + index * (barWidth + 10) + 5;
          const y = padding.top + chartHeight - barHeight;
          const barColor = item.color || COLORS.primary;

          return (
            <G key={index}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={barColor} rx={4} />
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize={10}
                fill={COLORS.text}
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toFixed(0)}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={height - 10}
                fontSize={9}
                fill={COLORS.gray}
                textAnchor="middle"
              >
                {item.label.length > 6 ? item.label.substring(0, 6) + "..." : item.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  title?: string;
  size?: number;
  showLegend?: boolean;
}

export function PieChart({ data, title, size = 160, showLegend = true }: PieChartProps) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.noDataText}>Sem dados para exibir</Text>
      </View>
    );
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -Math.PI / 2;

  const slices = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return {
      ...item,
      pathD,
      percentage,
    };
  });

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.pieContainer}>
        <Svg width={size} height={size}>
          {slices.map((slice, index) => (
            <Path key={index} d={slice.pathD} fill={slice.color} />
          ))}
          {/* Center circle for donut effect */}
          <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill={COLORS.white} />
          <SvgText
            x={centerX}
            y={centerY - 5}
            fontSize={16}
            fill={COLORS.text}
            textAnchor="middle"
            fontWeight="bold"
          >
            {total}
          </SvgText>
          <SvgText x={centerX} y={centerY + 12} fontSize={10} fill={COLORS.gray} textAnchor="middle">
            Total
          </SvgText>
        </Svg>

        {showLegend && (
          <View style={styles.legendContainer}>
            {slices.map((slice, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel}>{slice.label}</Text>
                <Text style={styles.legendValue}>
                  {slice.value} ({(slice.percentage * 100).toFixed(0)}%)
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

interface ProgressBarProps {
  value: number;
  maxValue: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  maxValue,
  label,
  color = COLORS.primary,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      {label && (
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          {showPercentage && <Text style={styles.progressPercentage}>{percentage.toFixed(0)}%</Text>}
        </View>
      )}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    paddingVertical: 40,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
