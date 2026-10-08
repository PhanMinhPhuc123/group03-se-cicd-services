# 1. Stage Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Bỏ chữ AiService/ ở phía trước đi vì Docker đã đang đứng ở trong thư mục này rồi
COPY ["AiService.csproj", "./"]
RUN dotnet restore "AiService.csproj"

# Copy toàn bộ mã nguồn còn lại vào container
COPY . .

# Build project
RUN dotnet build "AiService.csproj" -c Release -o /app/build

# 2. Stage Publish
FROM build AS publish
RUN dotnet publish "AiService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 3. Stage Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AiService.dll"]